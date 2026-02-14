import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Type for conversation
type ConversationData = { id: string; participant_1: string; participant_2: string }

// GET /api/e2e/conversation-key - Get conversation key data
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

    // Get the other participant's public key for key exchange
    const otherUserId = conversation.participant_1 === user.id
      ? conversation.participant_2
      : conversation.participant_1

    const { data: otherKeyData } = await supabase
      .from("user_public_keys")
      .select("user_id, public_key, fingerprint")
      .eq("user_id", otherUserId)
      .single()

    // Check if conversation key exists
    const { data: convKeyData } = await supabase
      .from("conversation_keys")
      .select("id, created_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single()

    const keyData = convKeyData as { id: string; created_at: string } | null

    return NextResponse.json({
      data: {
        hasKey: !!keyData,
        otherUserKey: otherKeyData || null,
        keyCreatedAt: keyData?.created_at || null,
      },
    })
  } catch (error) {
    console.error("Error in GET /api/e2e/conversation-key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/e2e/conversation-key - Store conversation key (encrypted for this user)
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
    const { conversation_id, encrypted_key } = body

    if (!conversation_id || !encrypted_key) {
      return NextResponse.json(
        { error: "conversation_id and encrypted_key are required" },
        { status: 400 }
      )
    }

    // Verify user is part of this conversation
    const { data: convData, error: convError } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2")
      .eq("id", conversation_id)
      .single()

    if (convError || !convData) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const conversation = convData as ConversationData
    if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Store the encrypted conversation key
    const { data: keyData, error } = await adminClient
      .from("conversation_keys")
      .upsert(
        {
          conversation_id,
          user_id: user.id,
          encrypted_key,
        } as never,
        { onConflict: "conversation_id,user_id" }
      )
      .select()
      .single()

    if (error) {
      console.error("Error storing conversation key:", error)
      return NextResponse.json({ error: "Failed to store conversation key" }, { status: 500 })
    }

    return NextResponse.json({ data: keyData }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/e2e/conversation-key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
