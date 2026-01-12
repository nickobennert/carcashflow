"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
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
import { Skeleton } from "@/components/ui/skeleton"
import type { Profile } from "@/types"

export function UsersTable() {
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error

      setUsers((data as Profile[]) || [])
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Fehler beim Laden der Benutzer")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.username.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query)
    )
  })

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

  function getSubscriptionBadge(user: Profile) {
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

  if (isLoading) {
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
      <div className="flex items-center gap-4">
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
          {filteredUsers.length} von {users.length} Benutzern
        </p>
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Keine Benutzer gefunden</h3>
          <p className="text-sm text-muted-foreground">
            Versuche einen anderen Suchbegriff.
          </p>
        </div>
      ) : (
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
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
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
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
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
                        <DropdownMenuItem className="gap-2">
                          <Mail className="h-4 w-4" />
                          E-Mail senden
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2">
                          <Shield className="h-4 w-4" />
                          Zum Admin machen
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                          <Ban className="h-4 w-4" />
                          Benutzer sperren
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
