import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/connections/check?userId=xxx - Check connection status with a user
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json(
      { error: "userId parameter is required" },
      { status: 400 }
    )
  }

  if (userId === user.id) {
    return NextResponse.json({
      data: {
        status: "self",
        connection: null,
      },
    })
  }

  try {
    // Check if connection exists in either direction
    const { data: connectionData } = await supabase
      .from("connections")
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey (
          id, username, first_name, last_name, avatar_url
        ),
        addressee:profiles!connections_addressee_id_fkey (
          id, username, first_name, last_name, avatar_url
        )
      `)
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`
      )
      .single()

    const connection = connectionData as {
      id: string
      requester_id: string
      addressee_id: string
      status: string
      requester: unknown
      addressee: unknown
    } | null

    if (!connection) {
      return NextResponse.json({
        data: {
          status: "none",
          connection: null,
        },
      })
    }

    // Determine the relationship from current user's perspective
    const isSender = connection.requester_id === user.id
    let relationshipStatus: string

    if (connection.status === "pending") {
      relationshipStatus = isSender ? "pending_sent" : "pending_received"
    } else if (connection.status === "accepted") {
      relationshipStatus = "connected"
    } else if (connection.status === "blocked") {
      relationshipStatus = isSender ? "blocked_by_me" : "blocked_by_them"
    } else {
      relationshipStatus = connection.status
    }

    return NextResponse.json({
      data: {
        status: relationshipStatus,
        connection,
      },
    })
  } catch (error) {
    console.error("Error checking connection:", error)
    return NextResponse.json(
      { error: "Failed to check connection status" },
      { status: 500 }
    )
  }
}
