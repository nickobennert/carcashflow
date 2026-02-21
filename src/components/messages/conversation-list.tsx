"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import Link from "next/link"
import { ChevronRight, Search, Trash2, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ConversationWithDetails } from "@/types"

// Check if content looks like an encrypted message
function isEncryptedContent(content: string): boolean {
  if (!content) return false
  try {
    const parsed = JSON.parse(content)
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.ciphertext === "string" &&
      typeof parsed.iv === "string"
    )
  } catch {
    return false
  }
}

interface ConversationListProps {
  conversations: ConversationWithDetails[]
  currentUserId: string
}

export function ConversationList({ conversations: initialConversations, currentUserId }: ConversationListProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [searchQuery, setSearchQuery] = useState("")

  const handleRemove = (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId))
  }

  if (conversations.length === 0) {
    return null
  }

  // Filter conversations by search query (name, username, last message, route)
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((conv) => {
        const query = searchQuery.toLowerCase()
        const isP1 = conv.participant_1 === currentUserId
        const other = isP1 ? conv.participant_2_profile : conv.participant_1_profile

        const name = `${other.first_name || ""} ${other.last_name || ""}`.toLowerCase()
        const username = (other.username || "").toLowerCase()
        const lastMsg = (conv.last_message?.content || "").toLowerCase()
        const route = conv.ride?.route?.map((r: { address?: string }) => r.address || "").join(" ").toLowerCase() || ""

        return name.includes(query) || username.includes(query) || lastMsg.includes(query) || route.includes(query)
      })
    : conversations

  return (
    <div className="space-y-3">
      {/* Search bar */}
      {conversations.length > 2 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Chats durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Conversation list */}
      <div className="divide-y divide-border rounded-lg border bg-card overflow-hidden">
        {filteredConversations.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Keine Chats gefunden für &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              currentUserId={currentUserId}
              onRemove={handleRemove}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface ConversationItemProps {
  conversation: ConversationWithDetails
  currentUserId: string
  onRemove: (conversationId: string) => void
}

function ConversationItem({ conversation, currentUserId, onRemove }: ConversationItemProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  // Determine the other participant
  const isParticipant1 = conversation.participant_1 === currentUserId
  const otherParticipant = isParticipant1
    ? conversation.participant_2_profile
    : conversation.participant_1_profile

  // Format name
  const displayName = otherParticipant.first_name
    ? `${otherParticipant.first_name} ${otherParticipant.last_name || ""}`.trim()
    : otherParticipant.username

  // Get initials
  const initials = otherParticipant.first_name
    ? `${otherParticipant.first_name[0]}${otherParticipant.last_name?.[0] || ""}`
    : otherParticipant.username[0].toUpperCase()

  // Format last message time
  const lastMessageTime = conversation.last_message?.created_at
    ? formatDistanceToNow(new Date(conversation.last_message.created_at), {
        addSuffix: false,
        locale: de,
      })
    : null

  // Check if last message is from other user
  const isLastMessageFromOther =
    conversation.last_message?.sender_id !== currentUserId

  const hasUnread = (conversation.unread_count || 0) > 0

  // Get route info if available
  const routeInfo = conversation.ride
    ? `${extractCity(conversation.ride.route[0]?.address)} → ${extractCity(conversation.ride.route[conversation.ride.route.length - 1]?.address)}`
    : null

  const handleRemove = async () => {
    setIsRemoving(true)
    try {
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to remove")
      onRemove(conversation.id)
    } catch (err) {
      console.error("Error removing conversation:", err)
    } finally {
      setIsRemoving(false)
      setShowRemoveDialog(false)
    }
  }

  return (
    <>
      <div className={cn(
        "group relative flex items-center",
        hasUnread && "bg-primary/5"
      )}>
        <Link
          href={`/messages/${conversation.id}`}
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors flex-1 min-w-0"
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherParticipant.avatar_url || undefined} />
              <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
            </Avatar>
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ring-2 ring-card">
                {(conversation.unread_count || 0) > 9 ? "9+" : conversation.unread_count}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={cn(
                "font-medium text-sm truncate",
                hasUnread && "font-semibold"
              )}>
                {displayName}
              </span>
              {lastMessageTime && (
                <span className={cn(
                  "text-[11px] shrink-0",
                  hasUnread ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  {lastMessageTime}
                </span>
              )}
            </div>

            {/* Last message preview */}
            <div className="flex items-center gap-2 mt-0.5">
              <p
                className={cn(
                  "text-[13px] truncate flex-1",
                  hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {conversation.last_message ? (
                  <>
                    {!isLastMessageFromOther && (
                      <span className="text-muted-foreground">Du: </span>
                    )}
                    {isEncryptedContent(conversation.last_message.content)
                      ? "🔒 Verschlüsselte Nachricht"
                      : conversation.last_message.content}
                  </>
                ) : (
                  <span className="italic">Keine Nachrichten</span>
                )}
              </p>
            </div>

            {/* Route reference */}
            {routeInfo && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  conversation.ride?.type === "offer" ? "bg-offer" : "bg-request"
                )} />
                <span className="text-[11px] text-muted-foreground truncate">
                  {routeInfo}
                </span>
              </div>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        </Link>

        {/* Remove button - visible on hover (desktop) and always on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-12 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowRemoveDialog(true)
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chat entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Chat mit {displayName} wird für dich entfernt.
              Die andere Person kann den Chat weiterhin sehen.
              Wenn {displayName} dir eine neue Nachricht schickt, erscheint der Chat wieder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRemove()
              }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Wird entfernt..." : "Entfernen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function extractCity(address?: string): string {
  if (!address) return "Route"
  const parts = address.split(",")
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 2]?.trim()
    const withoutPostal = cityPart?.replace(/^\d{5}\s*/, "")
    return withoutPostal || parts[0]?.trim() || "Route"
  }
  return parts[0]?.trim() || "Route"
}
