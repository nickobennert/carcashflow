import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
  })
}

// Lazy initialization for Supabase admin (bypasses RLS)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(stripe, supabaseAdmin, session)
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(supabaseAdmin, subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabaseAdmin, subscription)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(supabaseAdmin, invoice)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(stripe, supabaseAdmin, invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = ReturnType<typeof createClient<any>>

async function handleCheckoutComplete(stripe: Stripe, supabaseAdmin: SupabaseAdmin, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id
  const tier = session.metadata?.tier || "basic"

  if (!userId) {
    console.error("No user ID in checkout session metadata")
    return
  }

  // Get subscription details
  const subscriptionId = session.subscription as string
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
  const subscriptionData = subscriptionResponse as unknown as { current_period_end: number }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      subscription_tier: tier,
      subscription_status: "active",
      stripe_subscription_id: subscriptionId,
      current_period_end: new Date(subscriptionData.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", userId)

  if (error) {
    console.error("Error updating profile after checkout:", error)
    throw error
  }

  console.log(`Subscription activated for user ${userId}: ${tier}`)
}

async function handleSubscriptionUpdate(supabaseAdmin: SupabaseAdmin, subscription: Stripe.Subscription) {
  const subData = subscription as unknown as {
    id: string
    metadata?: { supabase_user_id?: string }
    customer: string
    status: string
    current_period_end: number
  }

  const userId = subData.metadata?.supabase_user_id
  const customerId = subData.customer

  // If no user ID in metadata, try to find by customer ID
  let targetUserId = userId
  if (!targetUserId) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single()

    targetUserId = (profile as { id: string } | null)?.id
  }

  if (!targetUserId) {
    console.error("Could not find user for subscription:", subData.id)
    return
  }

  // Map Stripe status to our status
  let status: string
  switch (subData.status) {
    case "active":
      status = "active"
      break
    case "trialing":
      status = "trialing"
      break
    case "canceled":
    case "unpaid":
    case "past_due":
      status = "frozen"
      break
    default:
      status = "frozen"
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      subscription_status: status,
      stripe_subscription_id: subData.id,
      current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", targetUserId)

  if (error) {
    console.error("Error updating subscription:", error)
    throw error
  }

  console.log(`Subscription updated for user ${targetUserId}: ${status}`)
}

async function handleSubscriptionDeleted(supabaseAdmin: SupabaseAdmin, subscription: Stripe.Subscription) {
  const subData = subscription as unknown as {
    id: string
    metadata?: { supabase_user_id?: string }
    customer: string
  }

  const userId = subData.metadata?.supabase_user_id
  const customerId = subData.customer

  // Find user
  let targetUserId = userId
  if (!targetUserId) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single()

    targetUserId = (profile as { id: string } | null)?.id
  }

  if (!targetUserId) {
    console.error("Could not find user for canceled subscription:", subData.id)
    return
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      subscription_status: "frozen",
      stripe_subscription_id: null,
      current_period_end: null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", targetUserId)

  if (error) {
    console.error("Error handling subscription deletion:", error)
    throw error
  }

  // Create notification
  await supabaseAdmin.from("notifications").insert({
    user_id: targetUserId,
    type: "system",
    title: "Abonnement beendet",
    message: "Dein Abonnement wurde beendet. Erneuere es, um weiterhin alle Funktionen nutzen zu können.",
    data: {},
  } as never)

  console.log(`Subscription deleted for user ${targetUserId}`)
}

async function handlePaymentFailed(supabaseAdmin: SupabaseAdmin, invoice: Stripe.Invoice) {
  const invoiceData = invoice as unknown as { id: string; customer: string }
  const customerId = invoiceData.customer

  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single()

  const profile = profileData as { id: string } | null
  if (!profile) {
    console.error("Could not find user for failed payment:", customerId)
    return
  }

  // Create notification
  await supabaseAdmin.from("notifications").insert({
    user_id: profile.id,
    type: "system",
    title: "Zahlung fehlgeschlagen",
    message: "Deine letzte Zahlung konnte nicht verarbeitet werden. Bitte aktualisiere deine Zahlungsmethode.",
    data: { invoice_id: invoiceData.id },
  } as never)

  console.log(`Payment failed notification sent to user ${profile.id}`)
}

async function handlePaymentSucceeded(stripe: Stripe, supabaseAdmin: SupabaseAdmin, invoice: Stripe.Invoice) {
  const invoiceData = invoice as unknown as { customer: string; subscription: string | null }
  const customerId = invoiceData.customer
  const subscriptionId = invoiceData.subscription

  if (!subscriptionId) return // Not a subscription payment

  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single()

  const profile = profileData as { id: string } | null
  if (!profile) return

  // Get subscription to update period end
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
  const subscription = subscriptionResponse as unknown as { current_period_end: number }

  await supabaseAdmin
    .from("profiles")
    .update({
      subscription_status: "active",
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", profile.id)

  console.log(`Payment succeeded for user ${profile.id}`)
}
