import { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConversationView } from "@/components/messages/conversation-view"
import type { MessageWithSender, Profile, Ride, Conversation } from "@/types"

export const metadata: Metadata = {
  title: "Unterhaltung",
  description: "Nachrichtenverlauf",
}

interface ConversationPageProps {
  params: Promise<{ id: string }>
}

interface ConversationWithRelations extends Conversation {
  participant_1_profile: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">
  participant_2_profile: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">
  ride: Pick<Ride, "id" | "type" | "route" | "departure_date"> | null
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get conversation with participants
  const { data: conversationData } = await supabase
    .from("conversations")
    .select(`
      *,
      participant_1_profile:profiles!conversations_participant_1_fkey (
        id, username, first_name, last_name, avatar_url
      ),
      participant_2_profile:profiles!conversations_participant_2_fkey (
        id, username, first_name, last_name, avatar_url
      ),
      ride:rides (
        id, type, route, departure_date
      )
    `)
    .eq("id", id)
    .single()

  if (!conversationData) {
    notFound()
  }

  const conversation = conversationData as unknown as ConversationWithRelations

  // Verify user is participant
  if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
    notFound()
  }

  // Get messages
  const { data: messagesData } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey (
        id, username, first_name, last_name, avatar_url
      )
    `)
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  const messages = (messagesData || []) as MessageWithSender[]

  // Mark unread messages as read
  await supabase
    .from("messages")
    .update({ is_read: true } as never)
    .eq("conversation_id", id)
    .eq("is_read", false)
    .neq("sender_id", user.id)

  // Determine other participant
  const isParticipant1 = conversation.participant_1 === user.id
  const otherParticipant = isParticipant1
    ? conversation.participant_2_profile
    : conversation.participant_1_profile

  return (
    <ConversationView
      conversationId={id}
      currentUserId={user.id}
      otherParticipant={otherParticipant as Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">}
      messages={messages}
      ride={conversation.ride as Pick<Ride, "id" | "type" | "route" | "departure_date"> | null}
    />
  )
}
