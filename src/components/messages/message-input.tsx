"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Loader2, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MessageWithSender, Profile } from "@/types"

interface PendingAttachment {
  file: File
  previewUrl?: string
  type: "image" | "file"
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]

interface MessageInputProps {
  conversationId: string
  currentUserId: string
  otherUserId?: string
  e2eReady?: boolean  // Kept for API compatibility but no longer used
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
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Dateityp nicht erlaubt. Erlaubt: JPG, PNG, GIF, WebP, PDF")
      return
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Datei zu groß. Maximal 5MB erlaubt.")
      return
    }

    const type = file.type.startsWith("image/") ? "image" : "file"
    const previewUrl = type === "image" ? URL.createObjectURL(file) : undefined

    setAttachment({ file, previewUrl, type })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Remove pending attachment
  function removeAttachment() {
    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl)
    }
    setAttachment(null)
  }

  // Upload file to server
  async function uploadFile(file: File): Promise<{ url: string; type: string; name: string }> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("conversation_id", conversationId)

    const response = await fetch("/api/messages/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Upload fehlgeschlagen")
    }

    return response.json()
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    const trimmedContent = content.trim()
    if ((!trimmedContent && !attachment) || isLoading) return

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

      // Upload attachment if present
      let attachmentData: { url: string; type: string; name: string } | null = null
      if (attachment) {
        setIsUploading(true)
        try {
          attachmentData = await uploadFile(attachment.file)
        } catch (uploadErr) {
          console.error("Upload failed:", uploadErr)
          toast.error(uploadErr instanceof Error ? uploadErr.message : "Upload fehlgeschlagen")
          setIsLoading(false)
          setIsUploading(false)
          return
        }
        setIsUploading(false)
      }

      // Build insert data
      const insertData: Record<string, unknown> = {
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: trimmedContent || "",
        is_encrypted: false,
      }

      if (attachmentData) {
        insertData.attachment_url = attachmentData.url
        insertData.attachment_type = attachmentData.type
        insertData.attachment_name = attachmentData.name
      }

      // Insert message
      const { data: messageData, error } = await supabase
        .from("messages")
        .insert(insertData as never)
        .select()
        .single()

      if (error) throw error

      // Update conversation's updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() } as never)
        .eq("id", conversationId)

      // Optimistically add message to UI
      if (messageData && onMessageSent) {
        const fullMessage: MessageWithSender = {
          ...(messageData as unknown as MessageWithSender),
          content: trimmedContent || "",
          sender: profile as Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">,
        }
        onMessageSent(fullMessage)
      }

      setContent("")
      removeAttachment()

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

  const canSend = (content.trim().length > 0 || !!attachment) && !isLoading

  return (
    <div className="space-y-2">
      {/* Attachment preview */}
      {attachment && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          {attachment.type === "image" && attachment.previewUrl ? (
            <img
              src={attachment.previewUrl}
              alt="Vorschau"
              className="h-16 w-16 rounded object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded bg-background flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(attachment.file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={removeAttachment}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Attachment button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-full shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || !!attachment}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={attachment ? "Optionale Nachricht..." : "Nachricht schreiben..."}
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
              ? "bg-primary hover:bg-primary/90"
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
    </div>
  )
}
