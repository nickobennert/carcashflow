"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  Search,
  MoreHorizontal,
  Loader2,
  User,
  ShieldCheck,
  Ban,
  Mail,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react"
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
import { cn } from "@/lib/utils"
import type { Profile } from "@/types"

interface LegalAcceptance {
  version: string
  accepted_at: string
  ip_address: string | null
}

interface UserWithStats extends Profile {
  legal_acceptance?: LegalAcceptance | null
}

export function UsersTable() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
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
  }, [searchQuery, offset])

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadUsers()
    }, 300)
    return () => clearTimeout(debounce)
  }, [loadUsers])

  // Reset offset when search changes
  useEffect(() => {
    setOffset(0)
  }, [searchQuery])

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

      loadUsers()
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Aktion fehlgeschlagen")
    } finally {
      setActionLoading(null)
      setBanDialog({ open: false, user: null, action: "ban" })
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

  function getStatusBadge(user: UserWithStats) {
    if (user.is_banned) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Ban className="h-3 w-3" />
          Gesperrt
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="bg-offer text-white">
        Aktiv
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
      {/* Search */}
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
            Versuche einen anderen Suchbegriff.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className={cn(
                  "border rounded-lg p-4 space-y-3",
                  user.is_banned && "opacity-60"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {getDisplayName(user)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={actionLoading === user.id}
                        className="shrink-0"
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
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {getStatusBadge(user)}
                  {user.legal_acceptance ? (
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-offer" />
                      <span className="text-muted-foreground">AGB akzeptiert</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-muted-foreground">AGB ausstehend</span>
                    </div>
                  )}
                </div>
                {user.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Registriert: {format(new Date(user.created_at), "dd.MM.yy", { locale: de })}
                  </span>
                  {user.last_seen_at && (
                    <span>
                      Aktiv: {format(new Date(user.last_seen_at), "dd.MM.yy", { locale: de })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datenschutz</TableHead>
                  <TableHead>Registriert</TableHead>
                  <TableHead>Zuletzt aktiv</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className={user.is_banned ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
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
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email || "—"}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell>
                      {user.legal_acceptance ? (
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-offer" />
                          <span className="text-xs text-muted-foreground" title={`Akzeptiert am ${format(new Date(user.legal_acceptance.accepted_at), "dd.MM.yyyy HH:mm", { locale: de })}${user.legal_acceptance.ip_address ? ` von IP ${user.legal_acceptance.ip_address}` : ""}`}>
                            {format(new Date(user.legal_acceptance.accepted_at), "dd.MM.yy", { locale: de })}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <XCircle className="h-4 w-4 text-amber-500" />
                          <span className="text-xs text-muted-foreground">Ausstehend</span>
                        </div>
                      )}
                    </TableCell>
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
