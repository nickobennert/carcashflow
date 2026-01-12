"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ContactButtonProps {
  otherUserId: string
  rideId: string
  isOffer: boolean
}

export function ContactButton({ otherUserId, rideId, isOffer }: ContactButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleContact() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otherUserId,
          rideId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create conversation")
      }

      // Redirect to the conversation
      router.push(`/messages/${data.conversationId}`)
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast.error("Konnte Unterhaltung nicht starten")
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleContact}
      disabled={isLoading}
      className={cn(
        "w-full",
        isOffer
          ? "bg-offer hover:bg-offer/90"
          : "bg-request hover:bg-request/90"
      )}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="mr-2 h-4 w-4" />
      )}
      Kontakt aufnehmen
    </Button>
  )
}
