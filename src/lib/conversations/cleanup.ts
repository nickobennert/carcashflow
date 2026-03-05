import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Permanently delete a conversation and all related data:
 * Storage attachments → messages → E2E keys → notifications → hidden_conversations → conversation
 */
export async function permanentlyDeleteConversation(
  adminClient: ReturnType<typeof createAdminClient>,
  conversationId: string
) {
  // 0. Delete attachment files from Supabase Storage
  try {
    const { data: messagesWithAttachments } = await adminClient
      .from("messages")
      .select("attachment_url")
      .eq("conversation_id", conversationId)
      .not("attachment_url", "is", null)

    if (messagesWithAttachments && messagesWithAttachments.length > 0) {
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

  // 1. Delete all messages
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

  // 4. Delete hidden_conversations entries
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
