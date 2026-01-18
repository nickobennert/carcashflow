import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/conversations - Get all conversations for the current user
// Optimized: Single query with aggregated message data instead of N+1 queries
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all conversations with profiles, ride info, and messages in one query
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
        ),
        messages (
          id, content, created_at, sender_id, is_read
        )
      `)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching conversations:", error)
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }

    // Type for conversation from query
    type MessageResult = {
      id: string
      content: string
      created_at: string
      sender_id: string
      is_read: boolean
    }

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
      messages: MessageResult[]
    }

    // Process conversations to extract last_message and unread_count from already-fetched messages
    const conversationsWithDetails = ((conversations || []) as ConversationResult[]).map((conv) => {
      const messages = conv.messages || []

      // Sort messages by created_at descending to get last message
      const sortedMessages = [...messages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      const lastMessage = sortedMessages[0] || null

      // Count unread messages (not from current user and not read)
      const unreadCount = messages.filter(
        (msg) => msg.sender_id !== user.id && !msg.is_read
      ).length

      // Remove messages array from response (we only need last_message and unread_count)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { messages: _messages, ...convWithoutMessages } = conv

      return {
        ...convWithoutMessages,
        last_message: lastMessage ? {
          content: lastMessage.content,
          created_at: lastMessage.created_at,
          sender_id: lastMessage.sender_id,
        } : null,
        unread_count: unreadCount,
      }
    })

    return NextResponse.json({ data: conversationsWithDetails })
  } catch (error) {
    console.error("Error in GET /api/conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/conversations - Create or get existing conversation
// Fixed: Race condition prevented by checking for existing conversation with retry logic
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

    // Normalize participant order to prevent duplicates (lower UUID first)
    const [participant1, participant2] = [user.id, otherUserId].sort()

    // Check if conversation already exists between these users
    const { data: existingConversationData } = await supabase
      .from("conversations")
      .select("id")
      .eq("participant_1", participant1)
      .eq("participant_2", participant2)
      .maybeSingle()

    const existingConversation = existingConversationData as { id: string } | null

    if (existingConversation) {
      // Return existing conversation
      return NextResponse.json({ conversationId: existingConversation.id })
    }

    // Try to create new conversation with normalized participant order
    const { data: newConversationData, error } = await supabase
      .from("conversations")
      .insert({
        participant_1: participant1,
        participant_2: participant2,
        ride_id: rideId || null,
      } as never)
      .select("id")
      .single()

    // Handle race condition: if insert fails due to unique constraint, fetch existing
    if (error) {
      // Check if it's a unique constraint violation (code 23505)
      if (error.code === "23505") {
        // Another request created the conversation, fetch it
        const { data: raceConversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("participant_1", participant1)
          .eq("participant_2", participant2)
          .single()

        if (raceConversation) {
          return NextResponse.json({ conversationId: (raceConversation as { id: string }).id })
        }
      }

      console.error("Error creating conversation:", error)
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
    }

    const newConversation = newConversationData as { id: string } | null

    if (!newConversation) {
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
    }

    return NextResponse.json({ conversationId: newConversation.id }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
