import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/rides/cleanup - Clean up expired rides
// This endpoint can be called by:
// - Vercel Cron (configured in vercel.json)
// - Manual trigger from admin dashboard
// - External cron service
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (cron secret or admin user)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    let isAuthorized = false

    // Check cron secret
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true
    }

    // Check if admin user
    if (!isAuthorized) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: admin } = await supabase
          .from("super_admins")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (admin) {
          isAuthorized = true
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const now = new Date()
    const today = now.toISOString().split("T")[0]

    // 1. Find all expired rides (departure_date is in the past)
    const { data: expiredRides, error: findError } = await supabase
      .from("rides")
      .select("id, user_id, departure_date")
      .eq("status", "active")
      .lt("departure_date", today)

    if (findError) throw findError

    if (!expiredRides || expiredRides.length === 0) {
      return NextResponse.json({
        message: "No expired rides found",
        deleted: 0,
      })
    }

    const rideIds = (expiredRides as { id: string; user_id: string; departure_date: string }[]).map((r) => r.id)
    let deletedConversations = 0
    let deletedMessages = 0

    // 2. Find conversations linked to these rides
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .in("ride_id", rideIds)

    if (conversations && conversations.length > 0) {
      const conversationIds = (conversations as { id: string }[]).map((c) => c.id)

      // 3. Count then delete messages in these conversations
      const { count: msgCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", conversationIds)

      deletedMessages = msgCount || 0

      await supabase
        .from("messages")
        .delete()
        .in("conversation_id", conversationIds)

      // 4. Delete notifications related to these conversations
      for (const convId of conversationIds) {
        await supabase
          .from("notifications")
          .delete()
          .eq("type", "new_message")
          .filter("data->>conversation_id", "eq", convId)
      }

      // 5. Delete the conversations
      await supabase
        .from("conversations")
        .delete()
        .in("id", conversationIds)

      deletedConversations = conversationIds.length
    }

    // 6. Delete the expired rides
    const { error: deleteError } = await supabase
      .from("rides")
      .delete()
      .in("id", rideIds)

    if (deleteError) throw deleteError

    // 7. Log the cleanup
    console.log(
      `[Ride Cleanup] Deleted ${rideIds.length} expired rides, ` +
      `${deletedConversations} conversations, ${deletedMessages} messages`
    )

    return NextResponse.json({
      message: "Cleanup completed successfully",
      deleted_rides: rideIds.length,
      deleted_conversations: deletedConversations,
      deleted_messages: deletedMessages,
      ride_ids: rideIds,
    })
  } catch (error) {
    console.error("Error in ride cleanup:", error)
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    )
  }
}
