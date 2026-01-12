"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  Users,
  Clock,
  Check,
  X,
  Loader2,
  UserX,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { staggerContainer, staggerItem } from "@/lib/animations"
import type { ConnectionWithProfile, Profile } from "@/types"

interface ConnectionsListProps {
  currentUserId: string
}

export function ConnectionsList({ currentUserId }: ConnectionsListProps) {
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([])
  const [pendingReceived, setPendingReceived] = useState<ConnectionWithProfile[]>([])
  const [pendingSent, setPendingSent] = useState<ConnectionWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadConnections()
  }, [])

  async function loadConnections() {
    try {
      const response = await fetch("/api/connections")
      const { data, error } = await response.json()

      if (error) throw new Error(error)

      const accepted: ConnectionWithProfile[] = []
      const received: ConnectionWithProfile[] = []
      const sent: ConnectionWithProfile[] = []

      for (const conn of data as ConnectionWithProfile[]) {
        if (conn.status === "accepted") {
          accepted.push(conn)
        } else if (conn.status === "pending") {
          if (conn.addressee_id === currentUserId) {
            received.push(conn)
          } else {
            sent.push(conn)
          }
        }
      }

      setConnections(accepted)
      setPendingReceived(received)
      setPendingSent(sent)
    } catch (error) {
      console.error("Error loading connections:", error)
      toast.error("Fehler beim Laden der Verbindungen")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAccept(connectionId: string) {
    setActionLoading(connectionId)

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })

      const { error } = await response.json()
      if (error) throw new Error(error)

      // Move from pending to accepted
      const accepted = pendingReceived.find((c) => c.id === connectionId)
      if (accepted) {
        accepted.status = "accepted"
        setConnections((prev) => [accepted, ...prev])
        setPendingReceived((prev) => prev.filter((c) => c.id !== connectionId))
      }

      toast.success("Verbindung akzeptiert")
    } catch (error) {
      console.error("Error accepting:", error)
      toast.error("Fehler beim Akzeptieren")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(connectionId: string) {
    setActionLoading(connectionId)

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      })

      const { error } = await response.json()
      if (error) throw new Error(error)

      setPendingReceived((prev) => prev.filter((c) => c.id !== connectionId))
      toast.success("Anfrage abgelehnt")
    } catch (error) {
      console.error("Error rejecting:", error)
      toast.error("Fehler beim Ablehnen")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancel(connectionId: string) {
    setActionLoading(connectionId)

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      })

      const { error } = await response.json()
      if (error) throw new Error(error)

      setPendingSent((prev) => prev.filter((c) => c.id !== connectionId))
      toast.success("Anfrage zurückgezogen")
    } catch (error) {
      console.error("Error canceling:", error)
      toast.error("Fehler beim Zurückziehen")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRemove(connectionId: string) {
    setActionLoading(connectionId)

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      })

      const { error } = await response.json()
      if (error) throw new Error(error)

      setConnections((prev) => prev.filter((c) => c.id !== connectionId))
      toast.success("Verbindung entfernt")
    } catch (error) {
      console.error("Error removing:", error)
      toast.error("Fehler beim Entfernen")
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return <ConnectionsListSkeleton />
  }

  const totalPending = pendingReceived.length + pendingSent.length

  return (
    <Tabs defaultValue="connections" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="connections" className="gap-2">
          <Users className="h-4 w-4" />
          Verbindungen
          {connections.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {connections.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="pending" className="gap-2">
          <Clock className="h-4 w-4" />
          Ausstehend
          {totalPending > 0 && (
            <Badge variant="default" className="ml-1">
              {totalPending}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="connections">
        {connections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Noch keine Verbindungen</h3>
              <p className="text-sm text-muted-foreground">
                Verbinde dich mit anderen Nutzern, um ihre erweiterten Profile zu
                sehen.
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-4 sm:grid-cols-2"
          >
            {connections.map((connection) => {
              const otherUser =
                connection.requester_id === currentUserId
                  ? connection.addressee
                  : connection.requester

              return (
                <motion.div key={connection.id} variants={staggerItem}>
                  <ConnectionCard
                    user={otherUser}
                    connectionId={connection.id}
                    isLoading={actionLoading === connection.id}
                    onRemove={() => handleRemove(connection.id)}
                    showActions
                  />
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </TabsContent>

      <TabsContent value="pending" className="space-y-6">
        {/* Received Requests */}
        {pendingReceived.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Erhaltene Anfragen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingReceived.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between gap-4"
                >
                  <Link
                    href={`/u/${connection.requester.username}`}
                    target="_blank"
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <Avatar>
                      <AvatarImage
                        src={connection.requester.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {getInitials(connection.requester)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {getDisplayName(connection.requester)}
                      </p>
                      {connection.requester.city && (
                        <p className="text-sm text-muted-foreground truncate">
                          {connection.requester.city}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(connection.id)}
                      disabled={actionLoading === connection.id}
                    >
                      {actionLoading === connection.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(connection.id)}
                      disabled={actionLoading === connection.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Sent Requests */}
        {pendingSent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gesendete Anfragen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingSent.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between gap-4"
                >
                  <Link
                    href={`/u/${connection.addressee.username}`}
                    target="_blank"
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <Avatar>
                      <AvatarImage
                        src={connection.addressee.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {getInitials(connection.addressee)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {getDisplayName(connection.addressee)}
                      </p>
                      {connection.addressee.city && (
                        <p className="text-sm text-muted-foreground truncate">
                          {connection.addressee.city}
                        </p>
                      )}
                    </div>
                  </Link>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCancel(connection.id)}
                    disabled={actionLoading === connection.id}
                    className="shrink-0"
                  >
                    {actionLoading === connection.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Zurückziehen
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {totalPending === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Keine ausstehenden Anfragen</h3>
              <p className="text-sm text-muted-foreground">
                Du hast keine offenen Verbindungsanfragen.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}

interface ConnectionCardProps {
  user: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url" | "city">
  connectionId: string
  isLoading: boolean
  onRemove: () => void
  showActions?: boolean
}

function ConnectionCard({
  user,
  connectionId,
  isLoading,
  onRemove,
  showActions,
}: ConnectionCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={`/u/${user.username}`}
            target="_blank"
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>{getInitials(user)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold truncate">{getDisplayName(user)}</p>
              {user.city && (
                <p className="text-sm text-muted-foreground truncate">
                  {user.city}
                </p>
              )}
            </div>
          </Link>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
              <Link href={`/messages?user=${user.id}`}>
                <MessageSquare className="h-4 w-4" />
                Nachricht
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={isLoading}
              className="text-muted-foreground"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserX className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ConnectionsListSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}

function getDisplayName(
  user: Pick<Profile, "first_name" | "last_name" | "username">
): string {
  if (user.first_name) {
    return `${user.first_name} ${user.last_name || ""}`.trim()
  }
  return user.username
}

function getInitials(
  user: Pick<Profile, "first_name" | "last_name" | "username">
): string {
  if (user.first_name) {
    return `${user.first_name[0]}${user.last_name?.[0] || ""}`.toUpperCase()
  }
  return user.username[0].toUpperCase()
}
