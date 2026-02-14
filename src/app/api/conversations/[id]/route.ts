import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// DELETE /api/conversations/[id] - Delete a conversation and all its messages
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
    // Verify the user is a participant of this conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", id)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .single()

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      )
    }

    // Delete in order: messages → conversation_keys → notifications → conversation
    // Use adminClient to bypass RLS policies

    // 1. Delete all messages in this conversation
    const { error: msgError } = await adminClient
      .from("messages")
      .delete()
      .eq("conversation_id", id)

    if (msgError) {
      console.error("Error deleting messages:", msgError)
    }

    // 2. Delete E2E conversation keys
    const { error: keyError } = await adminClient
      .from("conversation_keys")
      .delete()
      .eq("conversation_id", id)

    if (keyError) {
      console.error("Error deleting conversation keys:", keyError)
    }

    // 3. Delete related notifications
    const { error: notifError } = await adminClient
      .from("notifications")
      .delete()
      .eq("type", "new_message")
      .filter("data->>conversation_id", "eq", id)

    if (notifError) {
      console.error("Error deleting notifications:", notifError)
    }

    // 4. Delete the conversation itself
    const { error } = await adminClient
      .from("conversations")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting conversation:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    )
  }
}
