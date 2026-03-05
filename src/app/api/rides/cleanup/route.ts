import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { permanentlyDeleteConversation } from "@/lib/conversations/cleanup"

// Shared cleanup logic
async function performCleanup(isAuthorized: boolean) {
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Use admin client to bypass RLS for cleanup operations
    const adminClient = createAdminClient()
    const now = new Date()
    const today = now.toISOString().split("T")[0]

    // 1. Find all expired rides (departure_date is in the past)
    const { data: expiredRides, error: findError } = await adminClient
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

    // 2. Find conversations linked to these rides
    const { data: conversations } = await adminClient
      .from("conversations")
      .select("id")
      .in("ride_id", rideIds)

    if (conversations && conversations.length > 0) {
      const conversationIds = (conversations as { id: string }[]).map((c) => c.id)

      // 3. Delete each conversation fully (attachments, messages, keys, notifications, etc.)
      for (const convId of conversationIds) {
        await permanentlyDeleteConversation(adminClient, convId)
      }

      deletedConversations = conversationIds.length
    }

    // 4. Delete ride-match notifications for expired rides
    for (const rideId of rideIds) {
      await adminClient
        .from("notifications")
        .delete()
        .eq("type", "ride_match")
        .filter("data->>ride_id", "eq", rideId)
    }

    // 5. Delete the expired rides (DSGVO: complete data removal)
    const { error: deleteError } = await adminClient
      .from("rides")
      .delete()
      .in("id", rideIds)

    if (deleteError) throw deleteError

    console.log(
      `[Ride Cleanup] Deleted ${rideIds.length} expired rides, ` +
      `${deletedConversations} conversations (incl. attachments & keys)`
    )

    return NextResponse.json({
      message: "Cleanup completed successfully",
      deleted_rides: rideIds.length,
      deleted_conversations: deletedConversations,
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

// Verify if request is authorized (cron secret or admin user)
async function checkAuthorization(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // Check cron secret
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }

  // Check if admin user
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: admin } = await supabase
        .from("super_admins")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (admin) return true
    }
  } catch {
    // Auth check failed, not authorized
  }

  return false
}

// GET /api/rides/cleanup - Called by Vercel Cron
export async function GET(request: NextRequest) {
  const isAuthorized = await checkAuthorization(request)
  return performCleanup(isAuthorized)
}

// POST /api/rides/cleanup - Manual trigger from admin dashboard
export async function POST(request: NextRequest) {
  const isAuthorized = await checkAuthorization(request)
  return performCleanup(isAuthorized)
}
