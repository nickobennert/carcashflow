import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendPushToMultiple, type PushSubscriptionData } from "@/lib/push/server"

// POST /api/push/send - Send push notification to a user (internal API)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, title, body: messageBody, data } = body

    if (!recipientId || !title || !messageBody) {
      return NextResponse.json(
        { error: "Missing required fields: recipientId, title, body" },
        { status: 400 }
      )
    }

    // Use admin client to get recipient's subscriptions (bypass RLS)
    const adminClient = createAdminClient()

    // Check if recipient has push enabled
    const { data: recipientProfile } = await adminClient
      .from("profiles")
      .select("push_enabled")
      .eq("id", recipientId)
      .single()

    const profileWithPush = recipientProfile as { push_enabled: boolean } | null
    if (!profileWithPush?.push_enabled) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "User has push notifications disabled",
      })
    }

    // Get all subscriptions for the recipient
    const { data: subscriptions, error } = await adminClient
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", recipientId)

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "No push subscriptions found",
      })
    }

    // Send push to all subscriptions
    const result = await sendPushToMultiple(
      subscriptions as PushSubscriptionData[],
      {
        title,
        body: messageBody,
        data,
      }
    )

    // Clean up expired subscriptions
    if (result.expired.length > 0) {
      await adminClient
        .from("push_subscriptions")
        .delete()
        .in("endpoint", result.expired)
    }

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      expired_cleaned: result.expired.length,
    })
  } catch (error) {
    console.error("Error in POST /api/push/send:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
