import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
