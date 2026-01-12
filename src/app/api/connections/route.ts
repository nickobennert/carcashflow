import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/connections - Get user's connections
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status") // 'pending', 'accepted', 'blocked', or null for all
  const type = searchParams.get("type") // 'sent', 'received', or null for all

  try {
    let query = supabase
      .from("connections")
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey (
          id, username, first_name, last_name, avatar_url, city
        ),
        addressee:profiles!connections_addressee_id_fkey (
          id, username, first_name, last_name, avatar_url, city
        )
      `)

    // Filter by status
    if (status) {
      query = query.eq("status", status)
    }

    // Filter by type (sent or received)
    if (type === "sent") {
      query = query.eq("requester_id", user.id)
    } else if (type === "received") {
      query = query.eq("addressee_id", user.id)
    } else {
      // Get all connections for this user
      query = query.or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching connections:", error)
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    )
  }
}

// POST /api/connections - Create a new connection request
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { addressee_id } = await request.json()

    if (!addressee_id) {
      return NextResponse.json(
        { error: "addressee_id is required" },
        { status: 400 }
      )
    }

    if (addressee_id === user.id) {
      return NextResponse.json(
        { error: "Cannot connect with yourself" },
        { status: 400 }
      )
    }

    // Check if connection already exists (in either direction)
    const { data: existingData } = await supabase
      .from("connections")
      .select("id, status")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${addressee_id}),and(requester_id.eq.${addressee_id},addressee_id.eq.${user.id})`
      )
      .single()

    const existing = existingData as { id: string; status: string } | null

    if (existing) {
      if (existing.status === "blocked") {
        return NextResponse.json(
          { error: "Connection not allowed" },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: "Connection already exists", data: existing },
        { status: 409 }
      )
    }

    // Create the connection request
    const { data, error } = await supabase
      .from("connections")
      .insert({
        requester_id: user.id,
        addressee_id: addressee_id,
        status: "pending",
      } as never)
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey (
          id, username, first_name, last_name, avatar_url, city
        ),
        addressee:profiles!connections_addressee_id_fkey (
          id, username, first_name, last_name, avatar_url, city
        )
      `)
      .single()

    if (error) throw error

    const connectionData = data as unknown as { id: string }

    // Create notification for the addressee
    await supabase.from("notifications").insert({
      user_id: addressee_id,
      type: "connection_request",
      title: "Neue Verbindungsanfrage",
      message: `Du hast eine Verbindungsanfrage erhalten`,
      data: { connection_id: connectionData.id, requester_id: user.id },
    } as never)

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("Error creating connection:", error)
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    )
  }
}
