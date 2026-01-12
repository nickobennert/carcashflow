import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/connections/[id] - Get a specific connection
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
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
      .eq("id", id)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Connection not found" },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching connection:", error)
    return NextResponse.json(
      { error: "Failed to fetch connection" },
      { status: 500 }
    )
  }
}

// PATCH /api/connections/[id] - Update connection status (accept/reject/block)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { status } = await request.json()

    if (!status || !["accepted", "blocked"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'accepted' or 'blocked'" },
        { status: 400 }
      )
    }

    // First get the connection to verify permissions
    const { data: connectionData, error: fetchError } = await supabase
      .from("connections")
      .select("id, requester_id, addressee_id, status")
      .eq("id", id)
      .single()

    const connection = connectionData as { id: string; requester_id: string; addressee_id: string; status: string } | null

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      )
    }

    // Only the addressee can accept/reject, both can block
    if (status === "accepted" && connection.addressee_id !== user.id) {
      return NextResponse.json(
        { error: "Only the recipient can accept a connection request" },
        { status: 403 }
      )
    }

    if (
      connection.requester_id !== user.id &&
      connection.addressee_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Not authorized to update this connection" },
        { status: 403 }
      )
    }

    // Update the connection
    const { data, error } = await supabase
      .from("connections")
      .update({ status } as never)
      .eq("id", id)
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

    // Notify the requester if connection was accepted
    if (status === "accepted") {
      await supabase.from("notifications").insert({
        user_id: connection.requester_id,
        type: "connection_request",
        title: "Verbindungsanfrage akzeptiert",
        message: "Deine Verbindungsanfrage wurde akzeptiert",
        data: { connection_id: id },
      } as never)
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error updating connection:", error)
    return NextResponse.json(
      { error: "Failed to update connection" },
      { status: 500 }
    )
  }
}

// DELETE /api/connections/[id] - Delete/cancel a connection
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verify user is part of this connection
    const { data: connectionData } = await supabase
      .from("connections")
      .select("requester_id, addressee_id")
      .eq("id", id)
      .single()

    const connection = connectionData as { requester_id: string; addressee_id: string } | null

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      )
    }

    if (
      connection.requester_id !== user.id &&
      connection.addressee_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Not authorized to delete this connection" },
        { status: 403 }
      )
    }

    const { error } = await supabase.from("connections").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Connection deleted" })
  } catch (error) {
    console.error("Error deleting connection:", error)
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    )
  }
}
