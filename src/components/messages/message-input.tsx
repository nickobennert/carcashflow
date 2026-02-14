"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getE2EService } from "@/lib/crypto/e2e-service"
import type { MessageWithSender, Profile } from "@/types"

interface MessageInputProps {
  conversationId: string
  currentUserId: string
  otherUserId?: string
  e2eReady?: boolean
  onTyping?: (isTyping: boolean) => void
  onMessageSent?: (message: MessageWithSender) => void
}

export function MessageInput({
  conversationId,
  currentUserId,
  otherUserId,
  e2eReady = false,
  onTyping,
  onMessageSent,
}: MessageInputProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const supabase = createClient()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [content])

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!onTyping) return

    // Send typing: true if not already typing
    if (!isTypingRef.current) {
      isTypingRef.current = true
      onTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing after 5 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      onTyping(false)
    }, 5000)
  }, [onTyping])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTypingRef.current && onTyping) {
        onTyping(false)
      }
    }
  }, [onTyping])

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    const trimmedContent = content.trim()
    if (!trimmedContent || isLoading) return

    setIsLoading(true)

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (isTypingRef.current && onTyping) {
      isTypingRef.current = false
      onTyping(false)
    }

    try {
      // Get current user's profile for sender info
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, first_name, last_name, avatar_url")
        .eq("id", currentUserId)
        .single()

      if (!profile) {
        throw new Error("Profile not found")
      }

      // Encrypt message if E2E is ready
      let contentToSend = trimmedContent
      let isEncrypted = false

      if (e2eReady && otherUserId) {
        try {
          const e2eService = getE2EService(currentUserId)
          contentToSend = await e2eService.encryptMessageForConversation(
            conversationId,
            trimmedContent
          )
          isEncrypted = true
        } catch (encryptError) {
          console.error("Failed to encrypt message:", encryptError)
          // Fall back to unencrypted
          contentToSend = trimmedContent
        }
      }

      // Insert message
      const { data: messageData, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: contentToSend,
          is_encrypted: isEncrypted,
        } as never)
        .select()
        .single()

      if (error) throw error

      // Update conversation's updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() } as never)
        .eq("id", conversationId)

      // Optimistically add message to UI (with original content for display)
      if (messageData && onMessageSent) {
        const fullMessage: MessageWithSender & { decryptedContent?: string } = {
          ...(messageData as unknown as MessageWithSender),
          // Store original content for immediate display (we encrypted it, so we know the original)
          content: isEncrypted ? contentToSend : trimmedContent,
          sender: profile as Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">,
        }
        onMessageSent(fullMessage)
      }

      setContent("")

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Nachricht konnte nicht gesendet werden")
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    handleTyping()
  }

  const canSend = content.trim().length > 0 && !isLoading

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={e2eReady ? "Verschlüsselte Nachricht..." : "Nachricht schreiben..."}
        className={cn(
          "flex-1 min-w-0 resize-none rounded-2xl border bg-background px-3 sm:px-4 py-2.5",
          "text-sm placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "min-h-[44px] max-h-[120px]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "scrollbar-none"
        )}
        style={{ scrollbarWidth: "none" }}
        rows={1}
        disabled={isLoading}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!canSend}
        className={cn(
          "h-11 w-11 rounded-full shrink-0 transition-all",
          canSend
            ? e2eReady
              ? "bg-offer hover:bg-offer/90"
              : "bg-primary hover:bg-primary/90"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </form>
  )
}
