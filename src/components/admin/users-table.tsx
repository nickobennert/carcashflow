"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  Search,
  MoreHorizontal,
  Loader2,
  User,
  Shield,
  Ban,
  Crown,
  Mail,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Skeleton } from "@/components/ui/skeleton"
import type { Profile } from "@/types"

interface UserWithStats extends Profile {
  is_banned?: boolean
}

export function UsersTable() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [banDialog, setBanDialog] = useState<{ open: boolean; user: UserWithStats | null; action: "ban" | "unban" }>({
    open: false,
    user: null,
    action: "ban",
  })
  const limit = 20

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("limit", limit.toString())
      params.set("offset", offset.toString())

      const response = await fetch(`/api/admin/users?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.data || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Fehler beim Laden der Benutzer")
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter, offset])

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadUsers()
    }, 300)
    return () => clearTimeout(debounce)
  }, [loadUsers])

  // Reset offset when search or filter changes
  useEffect(() => {
    setOffset(0)
  }, [searchQuery, statusFilter])

  async function handleBanUser(user: UserWithStats, action: "ban" | "unban") {
    setActionLoading(user.id)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Action failed")
      }

      toast.success(
        action === "ban"
          ? `${getDisplayName(user)} wurde gesperrt`
          : `${getDisplayName(user)} wurde entsperrt`
      )

      // Refresh list
      loadUsers()
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Aktion fehlgeschlagen")
    } finally {
      setActionLoading(null)
      setBanDialog({ open: false, user: null, action: "ban" })
    }
  }

  async function handleUpdateSubscription(user: UserWithStats, tier: string, status: string) {
    setActionLoading(user.id)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_tier: tier,
          subscription_status: status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Update failed")
      }

      toast.success(`Abonnement aktualisiert`)
      loadUsers()
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Aktualisierung fehlgeschlagen")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleToggleLifetime(user: UserWithStats) {
    setActionLoading(user.id)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_lifetime: !user.is_lifetime,
          subscription_status: !user.is_lifetime ? "active" : user.subscription_status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Update failed")
      }

      toast.success(
        !user.is_lifetime
          ? `${getDisplayName(user)} hat jetzt Lifetime-Zugang`
          : `Lifetime-Zugang entfernt`
      )
      loadUsers()
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Aktualisierung fehlgeschlagen")
    } finally {
      setActionLoading(null)
    }
  }

  function getDisplayName(user: Profile): string {
    if (user.first_name) {
      return `${user.first_name} ${user.last_name || ""}`.trim()
    }
    return user.username
  }

  function getInitials(user: Profile): string {
    if (user.first_name) {
      return `${user.first_name[0]}${user.last_name?.[0] || ""}`.toUpperCase()
    }
    return user.username[0].toUpperCase()
  }

  function getSubscriptionBadge(user: UserWithStats) {
    if (user.is_banned) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Ban className="h-3 w-3" />
          Gesperrt
        </Badge>
      )
    }

    if (user.is_lifetime) {
      return (
        <Badge variant="default" className="gap-1 bg-yellow-500">
          <Crown className="h-3 w-3" />
          Lifetime
        </Badge>
      )
    }

    const tierLabels: Record<string, string> = {
      trial: "Trial",
      basic: "Basis",
      premium: "Premium",
    }

    const statusColors: Record<string, string> = {
      active: "bg-emerald-500",
      trialing: "bg-blue-500",
      canceled: "bg-amber-500",
      frozen: "bg-red-500",
    }

    return (
      <Badge
        variant="secondary"
        className={`${statusColors[user.subscription_status] || ""} text-white`}
      >
        {tierLabels[user.subscription_tier] || user.subscription_tier}
      </Badge>
    )
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  if (isLoading && users.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Name, E-Mail, Username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="trialing">Testphase</SelectItem>
            <SelectItem value="frozen">Eingefroren</SelectItem>
            <SelectItem value="canceled">Gekündigt</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {total} Benutzer
        </p>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Keine Benutzer gefunden</h3>
          <p className="text-sm text-muted-foreground">
            Versuche einen anderen Suchbegriff oder Filter.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Abonnement</TableHead>
                  <TableHead>Registriert</TableHead>
                  <TableHead>Zuletzt aktiv</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className={user.is_banned ? "opacity-60" : ""}>
                    <TableCell>
                      <Link
                        href={`/u/${user.username}`}
                        target="_blank"
                        className="flex items-center gap-3 hover:underline"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {getDisplayName(user)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{user.email || "—"}</TableCell>
                    <TableCell>{getSubscriptionBadge(user)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "dd.MM.yyyy", {
                        locale: de,
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.last_seen_at
                        ? format(new Date(user.last_seen_at), "dd.MM.yyyy HH:mm", {
                            locale: de,
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/u/${user.username}`} target="_blank" className="gap-2">
                              <User className="h-4 w-4" />
                              Profil anzeigen
                            </Link>
                          </DropdownMenuItem>
                          {user.email && (
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => window.open(`mailto:${user.email}`)}
                            >
                              <Mail className="h-4 w-4" />
                              E-Mail senden
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => handleToggleLifetime(user)}
                          >
                            <Crown className="h-4 w-4" />
                            {user.is_lifetime ? "Lifetime entfernen" : "Lifetime gewähren"}
                          </DropdownMenuItem>
                          {!user.is_lifetime && (
                            <>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => handleUpdateSubscription(user, "premium", "active")}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Auf Premium setzen
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => handleUpdateSubscription(user, "basic", "active")}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Auf Basis setzen
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          {user.is_banned ? (
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setBanDialog({ open: true, user, action: "unban" })}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Benutzer entsperren
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="gap-2 text-destructive focus:text-destructive"
                              onClick={() => setBanDialog({ open: true, user, action: "ban" })}
                            >
                              <Ban className="h-4 w-4" />
                              Benutzer sperren
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Seite {currentPage} von {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Zurück
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                >
                  Weiter
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Ban/Unban Dialog */}
      <AlertDialog
        open={banDialog.open}
        onOpenChange={(open) => {
          if (!open) setBanDialog({ open: false, user: null, action: "ban" })
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {banDialog.action === "ban" ? "Benutzer sperren" : "Benutzer entsperren"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {banDialog.action === "ban" ? (
                <>
                  Bist du sicher, dass du <strong>{banDialog.user && getDisplayName(banDialog.user)}</strong> sperren möchtest?
                  Der Benutzer wird eine Benachrichtigung erhalten und kann sich nicht mehr anmelden.
                </>
              ) : (
                <>
                  Bist du sicher, dass du <strong>{banDialog.user && getDisplayName(banDialog.user)}</strong> entsperren möchtest?
                  Der Benutzer kann sich dann wieder anmelden.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className={banDialog.action === "ban" ? "bg-destructive hover:bg-destructive/90" : ""}
              onClick={() => banDialog.user && handleBanUser(banDialog.user, banDialog.action)}
            >
              {banDialog.action === "ban" ? "Sperren" : "Entsperren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
