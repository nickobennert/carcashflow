import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/conversations - Get all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        id,
        participant_1,
        participant_2,
        ride_id,
        created_at,
        updated_at,
        participant_1_profile:profiles!conversations_participant_1_fkey (
          id, username, first_name, last_name, avatar_url
        ),
        participant_2_profile:profiles!conversations_participant_2_fkey (
          id, username, first_name, last_name, avatar_url
        ),
        ride:rides!conversations_ride_id_fkey (
          id, type, route, departure_date
        )
      `)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching conversations:", error)
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }

    // Type for conversation from query
    type ConversationResult = {
      id: string
      participant_1: string
      participant_2: string
      ride_id: string | null
      created_at: string
      updated_at: string
      participant_1_profile: unknown
      participant_2_profile: unknown
      ride: unknown
    }

    // For each conversation, get the last message and unread count
    const conversationsWithDetails = await Promise.all(
      ((conversations || []) as ConversationResult[]).map(async (conv) => {
        // Get last message
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        // Get unread count
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_id", user.id)

        return {
          ...conv,
          last_message: lastMessage || null,
          unread_count: unreadCount || 0,
        }
      })
    )

    return NextResponse.json({ data: conversationsWithDetails })
  } catch (error) {
    console.error("Error in GET /api/conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/conversations - Create or get existing conversation
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
    const { otherUserId, rideId } = body

    if (!otherUserId) {
      return NextResponse.json({ error: "otherUserId is required" }, { status: 400 })
    }

    // Check if user is trying to message themselves
    if (otherUserId === user.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
    }

    // Check if conversation already exists between these users
    const { data: existingConversationData } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
      )
      .single()

    const existingConversation = existingConversationData as { id: string } | null

    if (existingConversation) {
      // Return existing conversation
      return NextResponse.json({ conversationId: existingConversation.id })
    }

    // Create new conversation
    const { data: newConversationData, error } = await supabase
      .from("conversations")
      .insert({
        participant_1: user.id,
        participant_2: otherUserId,
        ride_id: rideId || null,
      } as never)
      .select("id")
      .single()

    const newConversation = newConversationData as { id: string } | null

    if (error || !newConversation) {
      console.error("Error creating conversation:", error)
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
    }

    return NextResponse.json({ conversationId: newConversation.id }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
