"use client"

import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ConversationWithDetails } from "@/types"

interface ConversationListProps {
  conversations: ConversationWithDetails[]
  currentUserId: string
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  if (conversations.length === 0) {
    return null
  }

  return (
    <div className="divide-y divide-border rounded-lg border bg-card overflow-hidden">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  )
}

interface ConversationItemProps {
  conversation: ConversationWithDetails
  currentUserId: string
}

function ConversationItem({ conversation, currentUserId }: ConversationItemProps) {
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

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
        hasUnread && "bg-primary/5"
      )}
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
                {conversation.last_message.content}
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
              conversation.ride?.type === "offer" ? "bg-emerald-500" : "bg-blue-500"
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
