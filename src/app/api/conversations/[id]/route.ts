import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// DELETE /api/conversations/[id] - Delete a conversation and all its messages
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verify the user is a participant of this conversation
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("conversation_id", id)
      .eq("user_id", user.id)
      .single()

    if (!participant) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      )
    }

    // Delete in order: messages → notifications → participants → conversation
    // 1. Delete all messages in this conversation
    await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", id)

    // 2. Delete related notifications
    await supabase
      .from("notifications")
      .delete()
      .eq("type", "new_message")
      .filter("data->>conversation_id", "eq", id)

    // 3. Delete conversation participants
    await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", id)

    // 4. Delete the conversation itself
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    )
  }
}
