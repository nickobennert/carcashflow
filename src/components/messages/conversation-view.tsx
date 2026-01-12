"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, isToday, isYesterday } from "date-fns"
import { de } from "date-fns/locale"
import { ArrowLeft, MoreVertical, Check, CheckCheck } from "lucide-react"
import Link from "next/link"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MessageInput } from "./message-input"
import { TypingIndicator } from "./typing-indicator"
import { useNotificationSound } from "@/hooks/use-notification-sound"
import { cn } from "@/lib/utils"
import type { MessageWithSender, Profile, Ride } from "@/types"

interface ConversationViewProps {
  conversationId: string
  currentUserId: string
  otherParticipant: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">
  messages: MessageWithSender[]
  ride: Pick<Ride, "id" | "type" | "route" | "departure_date"> | null
}

export function ConversationView({
  conversationId,
  currentUserId,
  otherParticipant,
  messages: initialMessages,
  ride,
}: ConversationViewProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const presenceChannelRef = useRef<RealtimeChannel | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [isOtherOnline, setIsOtherOnline] = useState(false)
  const supabase = createClient()
  const { playSound } = useNotificationSound()

  // Format participant name
  const displayName = otherParticipant.first_name
    ? `${otherParticipant.first_name} ${otherParticipant.last_name || ""}`.trim()
    : otherParticipant.username

  const initials = otherParticipant.first_name
    ? `${otherParticipant.first_name[0]}${otherParticipant.last_name?.[0] || ""}`
    : otherParticipant.username[0].toUpperCase()

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  // Initial scroll
  useEffect(() => {
    scrollToBottom("instant")
  }, [scrollToBottom])

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Subscribe to new messages via realtime
  useEffect(() => {
    const messageChannel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as { id: string; sender_id: string }

          // Don't add if it's our own message (already added optimistically)
          if (newMsg.sender_id === currentUserId) return

          // Fetch the complete message with sender info
          const { data: newMessageData } = await supabase
            .from("messages")
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                id, username, first_name, last_name, avatar_url
              )
            `)
            .eq("id", newMsg.id)
            .single()

          const newMessage = newMessageData as unknown as MessageWithSender | null

          if (newMessage) {
            setMessages((prev) => {
              // Prevent duplicates
              if (prev.some(m => m.id === newMessage.id)) return prev
              return [...prev, newMessage]
            })

            // Play notification sound
            playSound()

            // Mark as read
            await supabase
              .from("messages")
              .update({ is_read: true } as never)
              .eq("id", newMessage.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
    }
  }, [conversationId, currentUserId, supabase, playSound])

  // Presence channel for online status & typing indicator
  useEffect(() => {
    const presenceChannel = supabase.channel(`presence:${conversationId}`, {
      config: { presence: { key: currentUserId } },
    })

    presenceChannelRef.current = presenceChannel

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState()
        const otherPresent = Object.keys(state).includes(otherParticipant.id)
        setIsOtherOnline(otherPresent)
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key === otherParticipant.id) {
          setIsOtherOnline(true)
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key === otherParticipant.id) {
          setIsOtherOnline(false)
          setIsOtherTyping(false)
        }
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId === otherParticipant.id) {
          setIsOtherTyping(payload.isTyping)
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: currentUserId })
        }
      })

    return () => {
      presenceChannelRef.current = null
      supabase.removeChannel(presenceChannel)
    }
  }, [conversationId, currentUserId, otherParticipant.id, supabase])

  // Broadcast typing status using the stored channel reference
  const broadcastTyping = useCallback(
    async (isTyping: boolean) => {
      if (presenceChannelRef.current) {
        await presenceChannelRef.current.send({
          type: "broadcast",
          event: "typing",
          payload: { userId: currentUserId, isTyping },
        })
      }
    },
    [currentUserId]
  )

  // Add message optimistically
  const handleMessageSent = useCallback(
    (message: MessageWithSender) => {
      setMessages((prev) => [...prev, message])
    },
    []
  )

  // Group messages by date
  const messagesByDate = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed at top */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/messages")}
          className="h-9 w-9 shrink-0 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/messages")}
          className="h-9 w-9 shrink-0 hidden md:flex"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Link
          href={`/u/${otherParticipant.username}`}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant.avatar_url || undefined} />
              <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-card",
                isOtherOnline ? "bg-emerald-500" : "bg-zinc-400"
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {isOtherTyping ? (
                <span className="text-emerald-500 font-medium">tippt...</span>
              ) : isOtherOnline ? (
                <span className="text-emerald-500">Online</span>
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/u/${otherParticipant.username}`}>Profil anzeigen</Link>
            </DropdownMenuItem>
            {ride && (
              <DropdownMenuItem asChild>
                <Link href={`/rides/${ride.id}`}>Route anzeigen</Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Ride Context Banner */}
      {ride && (
        <Link
          href={`/rides/${ride.id}`}
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-muted/50 border-b text-xs hover:bg-muted transition-colors"
        >
          <span className={cn(
            "h-2 w-2 rounded-full shrink-0",
            ride.type === "offer" ? "bg-emerald-500" : "bg-blue-500"
          )} />
          <span className="text-muted-foreground">
            {ride.type === "offer" ? "Angebot" : "Gesuch"}:
          </span>
          <span className="font-medium truncate">
            {extractCity(ride.route[0]?.address)} → {extractCity(ride.route[ride.route.length - 1]?.address)}
          </span>
          <span className="text-muted-foreground ml-auto shrink-0">
            {format(new Date(ride.departure_date), "dd.MM.yyyy")}
          </span>
        </Link>
      )}

      {/* Messages Area - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-none min-h-0"
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          {Object.entries(messagesByDate).map(([date, dayMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex justify-center my-4">
                <span className="text-[11px] font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>

              {/* Messages for this date */}
              <div className="space-y-0.5">
                {dayMessages.map((message, index) => {
                  const isOwn = message.sender_id === currentUserId
                  const prevMessage = dayMessages[index - 1]
                  const nextMessage = dayMessages[index + 1]

                  const isFirstInGroup = !prevMessage || prevMessage.sender_id !== message.sender_id
                  const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id

                  // Add extra spacing between different senders
                  const hasGap = prevMessage && prevMessage.sender_id !== message.sender_id

                  return (
                    <div key={message.id} className={cn(hasGap && "pt-3")}>
                      <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        isFirstInGroup={isFirstInGroup}
                        isLastInGroup={isLastInGroup}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isOtherTyping && (
            <div className="flex items-end gap-2 pt-4">
              <Avatar className="h-7 w-7">
                <AvatarImage src={otherParticipant.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <footer className="shrink-0 border-t bg-card px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <MessageInput
            conversationId={conversationId}
            currentUserId={currentUserId}
            onTyping={broadcastTyping}
            onMessageSent={handleMessageSent}
          />
        </div>
      </footer>
    </div>
  )
}

interface MessageBubbleProps {
  message: MessageWithSender
  isOwn: boolean
  isFirstInGroup: boolean
  isLastInGroup: boolean
}

function MessageBubble({ message, isOwn, isFirstInGroup, isLastInGroup }: MessageBubbleProps) {
  const time = format(new Date(message.created_at), "HH:mm")

  // Determine border radius based on position in group
  const getBubbleRadius = () => {
    if (isOwn) {
      if (isFirstInGroup && isLastInGroup) return "rounded-2xl rounded-br-lg"
      if (isFirstInGroup) return "rounded-2xl rounded-br-md"
      if (isLastInGroup) return "rounded-2xl rounded-tr-md rounded-br-lg"
      return "rounded-2xl rounded-r-md"
    } else {
      if (isFirstInGroup && isLastInGroup) return "rounded-2xl rounded-bl-lg"
      if (isFirstInGroup) return "rounded-2xl rounded-bl-md"
      if (isLastInGroup) return "rounded-2xl rounded-tl-md rounded-bl-lg"
      return "rounded-2xl rounded-l-md"
    }
  }

  return (
    <div className={cn(
      "flex",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div
        className={cn(
          "max-w-[75%] sm:max-w-[65%] px-3.5 py-2",
          getBubbleRadius(),
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div
          className={cn(
            "flex items-center gap-1 justify-end mt-1",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          <span className="text-[10px]">{time}</span>
          {isOwn && (
            message.is_read ? (
              <CheckCheck className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )
          )}
        </div>
      </div>
    </div>
  )
}

function groupMessagesByDate(messages: MessageWithSender[]): Record<string, MessageWithSender[]> {
  const groups: Record<string, MessageWithSender[]> = {}

  for (const message of messages) {
    const msgDate = new Date(message.created_at)
    let dateLabel: string

    if (isToday(msgDate)) {
      dateLabel = "Heute"
    } else if (isYesterday(msgDate)) {
      dateLabel = "Gestern"
    } else {
      dateLabel = format(msgDate, "d. MMMM yyyy", { locale: de })
    }

    if (!groups[dateLabel]) {
      groups[dateLabel] = []
    }
    groups[dateLabel].push(message)
  }

  return groups
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
