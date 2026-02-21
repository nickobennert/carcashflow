import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Helper function to permanently delete a conversation and all related data
async function permanentlyDeleteConversation(adminClient: ReturnType<typeof createAdminClient>, conversationId: string) {
  // Delete in order: attachments (storage) → messages → conversation_keys → notifications → hidden_conversations → conversation

  // 0. Delete attachment files from Supabase Storage
  try {
    // First, get all messages with attachments for this conversation
    const { data: messagesWithAttachments } = await adminClient
      .from("messages")
      .select("attachment_url")
      .eq("conversation_id", conversationId)
      .not("attachment_url", "is", null)

    if (messagesWithAttachments && messagesWithAttachments.length > 0) {
      // Extract storage paths from the public URLs
      const filePaths = (messagesWithAttachments as { attachment_url: string }[])
        .map((m) => {
          // URL format: .../storage/v1/object/public/message-attachments/conversationId/userId-timestamp.ext
          const urlParts = m.attachment_url.split("/message-attachments/")
          return urlParts[1] // returns "conversationId/userId-timestamp.ext"
        })
        .filter(Boolean) as string[]

      if (filePaths.length > 0) {
        const { error: storageError } = await adminClient.storage
          .from("message-attachments")
          .remove(filePaths)

        if (storageError) {
          console.error("Error deleting attachment files:", storageError)
        }
      }
    }
  } catch (err) {
    // Don't block deletion if storage cleanup fails
    console.error("Error cleaning up attachments:", err)
  }

  // 1. Delete all messages in this conversation
  const { error: msgError } = await adminClient
    .from("messages")
    .delete()
    .eq("conversation_id", conversationId)

  if (msgError) {
    console.error("Error deleting messages:", msgError)
  }

  // 2. Delete E2E conversation keys
  const { error: keyError } = await adminClient
    .from("conversation_keys")
    .delete()
    .eq("conversation_id", conversationId)

  if (keyError) {
    console.error("Error deleting conversation keys:", keyError)
  }

  // 3. Delete related notifications
  const { error: notifError } = await adminClient
    .from("notifications")
    .delete()
    .eq("type", "new_message")
    .filter("data->>conversation_id", "eq", conversationId)

  if (notifError) {
    console.error("Error deleting notifications:", notifError)
  }

  // 4. Delete hidden_conversations entries for this conversation
  const { error: hiddenError } = await adminClient
    .from("hidden_conversations")
    .delete()
    .eq("conversation_id", conversationId)

  if (hiddenError) {
    console.error("Error deleting hidden_conversations:", hiddenError)
  }

  // 5. Delete the conversation itself
  const { error } = await adminClient
    .from("conversations")
    .delete()
    .eq("id", conversationId)

  if (error) {
    console.error("Error deleting conversation:", error)
    throw error
  }
}

// DELETE /api/conversations/[id] - Hide a conversation for the current user
// If both participants have hidden the conversation, it gets permanently deleted
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verify the user is a participant of this conversation and get both participant IDs
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2")
      .eq("id", id)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .single()

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      )
    }

    const conv = conversation as { id: string; participant_1: string; participant_2: string }
    const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1

    // Check if the other user has already hidden this conversation
    const { data: otherHidden } = await adminClient
      .from("hidden_conversations")
      .select("id")
      .eq("user_id", otherUserId)
      .eq("conversation_id", id)
      .maybeSingle()

    if (otherHidden) {
      // Both users want to hide -> permanently delete the conversation
      await permanentlyDeleteConversation(adminClient, id)
      return NextResponse.json({ success: true, deleted: true })
    }

    // Only current user wants to hide -> just add to hidden_conversations
    const { error } = await adminClient
      .from("hidden_conversations")
      .upsert(
        {
          user_id: user.id,
          conversation_id: id,
          hidden_at: new Date().toISOString(),
        } as never,
        { onConflict: "user_id,conversation_id" }
      )

    if (error) {
      console.error("Error hiding conversation:", error)
      throw error
    }

    return NextResponse.json({ success: true, deleted: false })
  } catch (error) {
    console.error("Error hiding conversation:", error)
    return NextResponse.json(
      { error: "Failed to hide conversation" },
      { status: 500 }
    )
  }
}
