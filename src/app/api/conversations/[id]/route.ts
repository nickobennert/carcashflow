import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { permanentlyDeleteConversation } from "@/lib/conversations/cleanup"

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
