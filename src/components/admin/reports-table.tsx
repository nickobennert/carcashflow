"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  MoreHorizontal,
  Loader2,
  Eye,
  User,
  Car,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { Profile, Ride } from "@/types"

interface ReportWithDetails {
  id: string
  reporter_id: string
  reported_user_id: string | null
  reported_ride_id: string | null
  reason: string
  description: string | null
  status: string
  admin_notes: string | null
  created_at: string
  resolved_at: string | null
  reporter: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">
  reported_user: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url"> | null
  reported_ride: Pick<Ride, "id" | "type" | "route" | "departure_date"> | null
}

const statusConfig = {
  pending: {
    label: "Ausstehend",
    icon: Clock,
    variant: "secondary" as const,
  },
  reviewed: {
    label: "In Bearbeitung",
    icon: Eye,
    variant: "secondary" as const,
  },
  resolved: {
    label: "Gelöst",
    icon: CheckCircle,
    variant: "default" as const,
  },
  dismissed: {
    label: "Abgelehnt",
    icon: XCircle,
    variant: "outline" as const,
  },
}

const reasonLabels: Record<string, string> = {
  spam: "Spam",
  inappropriate: "Unangemessen",
  fake: "Fake/Betrug",
  harassment: "Belästigung",
  other: "Sonstiges",
}

export function ReportsTable() {
  const [reports, setReports] = useState<ReportWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadReports()
  }, [statusFilter])

  async function loadReports() {
    setIsLoading(true)
    try {
      const url =
        statusFilter === "all"
          ? "/api/reports?admin=true"
          : `/api/reports?admin=true&status=${statusFilter}`

      const response = await fetch(url)
      const { data, error } = await response.json()

      if (error) throw new Error(error)

      setReports(data || [])
    } catch (error) {
      console.error("Error loading reports:", error)
      toast.error("Fehler beim Laden der Meldungen")
    } finally {
      setIsLoading(false)
    }
  }

  async function updateStatus(reportId: string, newStatus: string) {
    setActionLoading(reportId)
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const { error } = await response.json()
      if (error) throw new Error(error)

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      )
      toast.success("Status aktualisiert")
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Fehler beim Aktualisieren")
    } finally {
      setActionLoading(null)
    }
  }

  function getDisplayName(
    user: Pick<Profile, "first_name" | "last_name" | "username"> | null
  ): string {
    if (!user) return "Unbekannt"
    if (user.first_name) {
      return `${user.first_name} ${user.last_name || ""}`.trim()
    }
    return user.username
  }

  function getInitials(
    user: Pick<Profile, "first_name" | "last_name" | "username"> | null
  ): string {
    if (!user) return "?"
    if (user.first_name) {
      return `${user.first_name[0]}${user.last_name?.[0] || ""}`.toUpperCase()
    }
    return user.username[0].toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="pending">Ausstehend</SelectItem>
            <SelectItem value="reviewed">In Bearbeitung</SelectItem>
            <SelectItem value="resolved">Gelöst</SelectItem>
            <SelectItem value="dismissed">Abgelehnt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Keine Meldungen</h3>
          <p className="text-sm text-muted-foreground">
            Es gibt keine Meldungen mit diesem Status.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gemeldet von</TableHead>
                <TableHead>Ziel</TableHead>
                <TableHead>Grund</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const status = statusConfig[report.status as keyof typeof statusConfig]
                const StatusIcon = status?.icon || Clock

                return (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={report.reporter.avatar_url || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(report.reporter)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {getDisplayName(report.reporter)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.reported_user ? (
                        <Link
                          href={`/u/${report.reported_user.username}`}
                          target="_blank"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {getDisplayName(report.reported_user)}
                          </span>
                        </Link>
                      ) : report.reported_ride ? (
                        <Link
                          href={`/rides/${report.reported_ride.id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Route</span>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {reasonLabels[report.reason] || report.reason}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status?.variant || "secondary"} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status?.label || report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(report.created_at), "dd.MM.yyyy", {
                        locale: de,
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={actionLoading === report.id}
                          >
                            {actionLoading === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Status ändern</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => updateStatus(report.id, "reviewed")}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            In Bearbeitung
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus(report.id, "resolved")}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Als gelöst markieren
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus(report.id, "dismissed")}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Ablehnen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
