import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PUT /api/messages/read - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { conversation_id, message_ids } = body

    if (!conversation_id && !message_ids) {
      return NextResponse.json(
        { error: "Either conversation_id or message_ids is required" },
        { status: 400 }
      )
    }

    // Type for conversation
    type ConversationData = { id: string; participant_1: string; participant_2: string }

    // If conversation_id is provided, mark all messages in the conversation as read
    if (conversation_id) {
      // Verify user is part of this conversation
      const { data: conversationData, error: convError } = await supabase
        .from("conversations")
        .select("id, participant_1, participant_2")
        .eq("id", conversation_id)
        .single()

      if (convError || !conversationData) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
      }

      const conversation = conversationData as ConversationData
      if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      // Mark all unread messages (not sent by user) as read
      const { error, count } = await supabase
        .from("messages")
        .update({ is_read: true } as never)
        .eq("conversation_id", conversation_id)
        .eq("is_read", false)
        .neq("sender_id", user.id)

      if (error) {
        console.error("Error marking messages as read:", error)
        return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 })
      }

      return NextResponse.json({ success: true, markedAsRead: count || 0 })
    }

    // Type for message
    type MessageData = { id: string; conversation_id: string; sender_id: string }

    // If message_ids array is provided, mark specific messages as read
    if (message_ids && Array.isArray(message_ids)) {
      // First verify the user has access to these messages
      const { data: messagesData, error: fetchError } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id")
        .in("id", message_ids)

      if (fetchError) {
        console.error("Error fetching messages:", fetchError)
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
      }

      const messages = (messagesData || []) as MessageData[]

      // Get unique conversation IDs
      const conversationIds = [...new Set(messages.map((m) => m.conversation_id))]

      // Verify user is part of all conversations
      for (const convId of conversationIds) {
        const { data: convData } = await supabase
          .from("conversations")
          .select("participant_1, participant_2")
          .eq("id", convId)
          .single()

        const conv = convData as { participant_1: string; participant_2: string } | null
        if (!conv ||
          (conv.participant_1 !== user.id && conv.participant_2 !== user.id)) {
          return NextResponse.json({ error: "Access denied to some messages" }, { status: 403 })
        }
      }

      // Only mark messages not sent by the user
      const messagesToMark = messages
        .filter((m) => m.sender_id !== user.id)
        .map((m) => m.id)

      if (messagesToMark.length > 0) {
        const { error } = await supabase
          .from("messages")
          .update({ is_read: true } as never)
          .in("id", messagesToMark)

        if (error) {
          console.error("Error marking messages as read:", error)
          return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true, markedAsRead: messagesToMark.length })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Error in PUT /api/messages/read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
