import { Metadata } from "next"
import { redirect } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout"
import { Card, CardContent } from "@/components/ui/card"
import { ConversationList } from "@/components/messages/conversation-list"
import type { ConversationWithDetails, Profile, Message, Ride, Conversation } from "@/types"

export const metadata: Metadata = {
  title: "Nachrichten",
  description: "Deine Unterhaltungen mit anderen Nutzern",
}

interface ConversationFromDB extends Conversation {
  participant_1_profile: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">
  participant_2_profile: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">
  ride: Pick<Ride, "id" | "type" | "route" | "departure_date"> | null
}

export default async function MessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get all conversations for current user with participant profiles
  const { data: rawConversationsData } = await supabase
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
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order("updated_at", { ascending: false })

  const conversationsData = rawConversationsData as unknown as ConversationFromDB[] | null

  // Get last message and unread count for each conversation
  const conversations: ConversationWithDetails[] = []

  if (conversationsData) {
    for (const conv of conversationsData) {
      // Get last message
      const { data: lastMessageData } = await supabase
        .from("messages")
        .select("content, created_at, sender_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      // Get unread count
      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("is_read", false)
        .neq("sender_id", user.id)

      conversations.push({
        ...conv,
        participant_1_profile: conv.participant_1_profile,
        participant_2_profile: conv.participant_2_profile,
        ride: conv.ride,
        last_message: lastMessageData as Pick<Message, "content" | "created_at" | "sender_id"> | null,
        unread_count: unreadCount || 0,
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nachrichten"
        description="Unterhaltungen mit anderen Nutzern"
      />

      {conversations.length > 0 ? (
        <ConversationList
          conversations={conversations}
          currentUserId={user.id}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">Noch keine Nachrichten</h3>
            <p className="text-muted-foreground max-w-md">
              Wenn du bei einer Route auf &quot;Kontakt aufnehmen&quot; klickst,
              wird hier eine Unterhaltung erstellt.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
