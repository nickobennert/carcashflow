"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Hook that tracks unread message count with realtime updates.
 * Uses direct message query (is_read = false, sender != current user)
 * and subscribes to realtime INSERT events on the messages table.
 */
export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let pollInterval: ReturnType<typeof setInterval> | null = null

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Initial count
      await fetchUnreadCount(user.id)

      // Subscribe to new messages in real-time
      channel = supabase
        .channel(`unread-messages:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            // Only count messages NOT sent by current user
            const msg = payload.new as { sender_id: string; is_read: boolean }
            if (msg.sender_id !== user.id && !msg.is_read) {
              setUnreadCount((prev) => prev + 1)
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
          },
          () => {
            // When messages are marked as read, refetch count
            fetchUnreadCount(user.id)
          }
        )
        .subscribe()

      // Fallback polling every 30s
      pollInterval = setInterval(() => {
        fetchUnreadCount(user.id)
      }, 30000)
    }

    async function fetchUnreadCount(userId: string) {
      try {
        // Get all conversations where user is a participant
        const { data: conversations } = await supabase
          .from("conversations")
          .select("id")
          .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)

        if (!conversations || conversations.length === 0) {
          setUnreadCount(0)
          return
        }

        const conversationIds = (conversations as { id: string }[]).map((c) => c.id)

        // Count unread messages not sent by current user
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", conversationIds)
          .neq("sender_id", userId)
          .eq("is_read", false)

        if (!error && count !== null) {
          setUnreadCount(count)
        }
      } catch {
        // Silently fail - badge just won't update
      }
    }

    init()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [supabase])

  return unreadCount
}
