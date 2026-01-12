"use client"

import { useState, useEffect } from "react"
import {
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Loader2,
  Check,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type ConnectionStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "connected"
  | "blocked_by_me"
  | "blocked_by_them"
  | "self"

interface ConnectionButtonProps {
  userId: string
  currentUserId: string
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "outline" | "ghost"
}

export function ConnectionButton({
  userId,
  currentUserId,
  className,
  size = "default",
  variant = "outline",
}: ConnectionButtonProps) {
  const [status, setStatus] = useState<ConnectionStatus>("none")
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (userId === currentUserId) {
      setStatus("self")
      setIsLoading(false)
      return
    }

    async function checkConnection() {
      try {
        const response = await fetch(`/api/connections/check?userId=${userId}`)
        const { data, error } = await response.json()

        if (error) throw new Error(error)

        setStatus(data.status)
        setConnectionId(data.connection?.id || null)
      } catch (error) {
        console.error("Error checking connection:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkConnection()
  }, [userId, currentUserId, supabase])

  async function sendRequest() {
    setIsActionLoading(true)

    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressee_id: userId }),
      })

      const { data, error } = await response.json()

      if (error) {
        if (response.status === 409) {
          toast.info("Verbindungsanfrage existiert bereits")
        } else {
          throw new Error(error)
        }
        return
      }

      setStatus("pending_sent")
      setConnectionId(data.id)
      toast.success("Verbindungsanfrage gesendet")
    } catch (error) {
      console.error("Error sending request:", error)
      toast.error("Fehler beim Senden der Anfrage")
    } finally {
      setIsActionLoading(false)
    }
  }

  async function acceptRequest() {
    if (!connectionId) return
    setIsActionLoading(true)

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })

      const { error } = await response.json()
      if (error) throw new Error(error)

      setStatus("connected")
      toast.success("Verbindung akzeptiert")
    } catch (error) {
      console.error("Error accepting request:", error)
      toast.error("Fehler beim Akzeptieren")
    } finally {
      setIsActionLoading(false)
    }
  }

  async function rejectRequest() {
    if (!connectionId) return
    setIsActionLoading(true)

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      })

      const { error } = await response.json()
      if (error) throw new Error(error)

      setStatus("none")
      setConnectionId(null)
      toast.success("Anfrage abgelehnt")
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast.error("Fehler beim Ablehnen")
    } finally {
      setIsActionLoading(false)
    }
  }

  async function cancelRequest() {
    if (!connectionId) return
    setIsActionLoading(true)

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      })

      const { error } = await response.json()
      if (error) throw new Error(error)

      setStatus("none")
      setConnectionId(null)
      toast.success("Anfrage zurückgezogen")
    } catch (error) {
      console.error("Error canceling request:", error)
      toast.error("Fehler beim Zurückziehen")
    } finally {
      setIsActionLoading(false)
    }
  }

  async function removeConnection() {
    if (!connectionId) return
    setIsActionLoading(true)

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      })

      const { error } = await response.json()
      if (error) throw new Error(error)

      setStatus("none")
      setConnectionId(null)
      toast.success("Verbindung entfernt")
    } catch (error) {
      console.error("Error removing connection:", error)
      toast.error("Fehler beim Entfernen")
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (status === "self") {
    return null
  }

  if (status === "blocked_by_them" || status === "blocked_by_me") {
    return null
  }

  if (status === "none") {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={sendRequest}
        disabled={isActionLoading}
        className={cn("gap-2", className)}
      >
        {isActionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        Verbinden
      </Button>
    )
  }

  if (status === "pending_sent") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size={size}
            disabled={isActionLoading}
            className={cn("gap-2", className)}
          >
            {isActionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            Angefragt
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={cancelRequest} className="gap-2">
            <X className="h-4 w-4" />
            Anfrage zurückziehen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (status === "pending_received") {
    return (
      <div className={cn("flex gap-2", className)}>
        <Button
          variant="default"
          size={size}
          onClick={acceptRequest}
          disabled={isActionLoading}
          className="gap-2"
        >
          {isActionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Annehmen
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={rejectRequest}
          disabled={isActionLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (status === "connected") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size={size}
            disabled={isActionLoading}
            className={cn("gap-2", className)}
          >
            {isActionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
            Verbunden
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={removeConnection}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <UserX className="h-4 w-4" />
            Verbindung entfernen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return null
}
