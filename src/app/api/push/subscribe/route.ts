import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/push/subscribe - Subscribe to push notifications
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
    const { endpoint, p256dh, auth } = body

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Missing required subscription data" },
        { status: 400 }
      )
    }

    // Get user agent for device identification
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Upsert the subscription (update if same endpoint exists)
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          user_agent: userAgent,
          last_used_at: new Date().toISOString(),
        } as never,
        {
          onConflict: "user_id,endpoint",
        }
      )
      .select()
      .single()

    if (error) {
      console.error("Error saving push subscription:", error)
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 }
      )
    }

    // Update profile to enable push
    await supabase
      .from("profiles")
      .update({ push_enabled: true } as never)
      .eq("id", user.id)

    return NextResponse.json({ data, success: true }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/push/subscribe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/push/subscribe - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint" },
        { status: 400 }
      )
    }

    // Delete the subscription
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint)

    if (error) {
      console.error("Error deleting push subscription:", error)
      return NextResponse.json(
        { error: "Failed to delete subscription" },
        { status: 500 }
      )
    }

    // Check if user has any remaining subscriptions
    const { count } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)

    // If no subscriptions left, disable push in profile
    if (count === 0) {
      await supabase
        .from("profiles")
        .update({ push_enabled: false } as never)
        .eq("id", user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/push/subscribe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/push/subscribe - Check subscription status
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, user_agent, created_at, last_used_at")
      .eq("user_id", user.id)

    if (error) {
      console.error("Error fetching push subscriptions:", error)
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      )
    }

    // Get push_enabled status from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("push_enabled")
      .eq("id", user.id)
      .single()

    const profileWithPush = profile as { push_enabled: boolean } | null
    return NextResponse.json({
      push_enabled: profileWithPush?.push_enabled ?? false,
      subscriptions: subscriptions || [],
      subscription_count: subscriptions?.length || 0,
    })
  } catch (error) {
    console.error("Error in GET /api/push/subscribe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
