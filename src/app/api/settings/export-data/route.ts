import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/settings/export-data - DSGVO Article 20 (Right to Data Portability)
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Collect all user data in parallel
    const [
      { data: profileData },
      { data: ridesData },
      { data: conversationsData },
      { data: messagesData },
      { data: routeWatchesData },
      { data: legalAcceptancesData },
      { data: notificationsData },
    ] = await Promise.all([
      // Profile
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single(),

      // Rides created by user
      supabase
        .from("rides")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      // Conversations
      supabase
        .from("conversations")
        .select("*")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order("created_at", { ascending: false }),

      // Messages sent by user
      supabase
        .from("messages")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false }),

      // Route watches
      supabase
        .from("route_watches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      // Legal acceptances
      supabase
        .from("legal_acceptances")
        .select("*")
        .eq("user_id", user.id),

      // Notifications
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ])

    // Type cast the results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = profileData as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rides = (ridesData || []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversations = (conversationsData || []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = (messagesData || []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routeWatches = (routeWatchesData || []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legalAcceptances = (legalAcceptancesData || []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifications = (notificationsData || []) as any[]

    // Build export object according to DSGVO Article 20
    // "structured, commonly used and machine-readable format"
    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        format_version: "1.0",
        app: "Fahr mit! - Mitfahrbörse",
      },
      profile: profile ? {
        username: profile.username,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        city: profile.city,
        training_location: profile.training_location,
        training_date: profile.training_date,
        theme_preference: profile.theme_preference,
        notification_preferences: profile.notification_preferences,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_seen_at: profile.last_seen_at,
      } : null,
      rides: rides.map((ride) => ({
        id: ride.id,
        type: ride.type,
        route: ride.route,
        departure_date: ride.departure_date,
        departure_time: ride.departure_time,
        seats_available: ride.seats_available,
        comment: ride.comment,
        status: ride.status,
        is_recurring: ride.is_recurring,
        recurring_days: ride.recurring_days,
        recurring_until: ride.recurring_until,
        created_at: ride.created_at,
      })),
      conversations: conversations.map((conv) => ({
        id: conv.id,
        with_user: conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1,
        ride_id: conv.ride_id,
        created_at: conv.created_at,
      })),
      messages_sent: messages.map((msg) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        content: msg.content,
        created_at: msg.created_at,
      })),
      route_watches: routeWatches.map((watch) => ({
        id: watch.id,
        name: watch.name,
        type: watch.type,
        location_address: watch.location_address,
        start_address: watch.start_address,
        end_address: watch.end_address,
        radius_km: watch.radius_km,
        ride_type: watch.ride_type,
        is_active: watch.is_active,
        created_at: watch.created_at,
      })),
      legal_acceptances: legalAcceptances.map((la) => ({
        type: la.acceptance_type,
        version: la.version,
        accepted_at: la.accepted_at,
      })),
      notifications: notifications.map((notif) => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        is_read: notif.is_read,
        created_at: notif.created_at,
      })),
    }

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="fahrmit-daten-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })

  } catch (error) {
    console.error("Error in GET /api/settings/export-data:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
