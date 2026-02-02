import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Type for conversation
type ConversationData = { id: string; participant_1: string; participant_2: string }

// GET /api/messages?conversation_id=xxx - Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get("conversation_id")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    if (!conversationId) {
      return NextResponse.json({ error: "conversation_id is required" }, { status: 400 })
    }

    // Verify user is part of this conversation
    const { data: convData, error: convError } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2")
      .eq("id", conversationId)
      .single()

    if (convError || !convData) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const conversation = convData as ConversationData
    if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get messages with sender info
    const { data: messages, error, count } = await supabase
      .from("messages")
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        is_read,
        created_at,
        sender:profiles!messages_sender_id_fkey (
          id, username, first_name, last_name, avatar_url
        )
      `, { count: "exact" })
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({
      data: messages,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false,
      },
    })
  } catch (error) {
    console.error("Error in GET /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/messages - Send a new message
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
    const { conversation_id, content } = body

    if (!conversation_id) {
      return NextResponse.json({ error: "conversation_id is required" }, { status: 400 })
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "Message too long (max 2000 characters)" }, { status: 400 })
    }

    // Verify user is part of this conversation
    const { data: convData2, error: convError } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2")
      .eq("id", conversation_id)
      .single()

    if (convError || !convData2) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const conversation = convData2 as ConversationData
    if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Create the message
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id,
        sender_id: user.id,
        content: content.trim(),
        is_read: false,
      } as never)
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        is_read,
        created_at,
        sender:profiles!messages_sender_id_fkey (
          id, username, first_name, last_name, avatar_url
        )
      `)
      .single()

    if (msgError) {
      console.error("Error creating message:", msgError)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    // Update conversation's updated_at
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() } as never)
      .eq("id", conversation_id)

    // Get the other participant ID for notification
    const otherUserId = conversation.participant_1 === user.id
      ? conversation.participant_2
      : conversation.participant_1

    // Get sender profile for a more descriptive notification title
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("first_name, username")
      .eq("id", user.id)
      .single()

    const profile = senderProfile as { first_name: string | null; username: string | null } | null
    const senderName = profile?.first_name || profile?.username || "Jemand"

    // Create notification for the recipient using admin client (bypasses RLS)
    // The regular server client uses ANON key which can't INSERT into notifications table
    try {
      const adminClient = createAdminClient()
      const { data: notifData, error: notifError } = await adminClient.from("notifications").insert({
        user_id: otherUserId,
        type: "new_message",
        title: `Neue Nachricht von ${senderName}`,
        message: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
        data: { conversation_id, sender_id: user.id },
      } as never)
      .select("id")
      .single()

      if (notifError) {
        console.error("Error creating notification:", JSON.stringify(notifError))
        console.error("Notification payload:", { user_id: otherUserId, type: "new_message" })
      } else {
        console.log(`Notification created: ${(notifData as { id: string } | null)?.id} for user ${otherUserId}`)
      }
    } catch (notifErr) {
      console.error("Notification creation failed:", notifErr)
    }

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
