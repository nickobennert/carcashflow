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
  ExternalLink,
  Wrench,
  Bug,
} from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Profile } from "@/types"

interface BugReportWithUser {
  id: string
  user_id: string
  title: string
  area: string
  description: string
  worked_before: string | null
  expected_behavior: string | null
  screencast_url: string | null
  screenshots: string[] | null
  status: string
  admin_notes: string | null
  user_agent: string | null
  created_at: string
  resolved_at: string | null
  user: Pick<Profile, "id" | "username" | "first_name" | "last_name" | "avatar_url">
}

const statusConfig = {
  open: {
    label: "Offen",
    icon: Bug,
    variant: "destructive" as const,
  },
  in_progress: {
    label: "In Bearbeitung",
    icon: Wrench,
    variant: "secondary" as const,
  },
  resolved: {
    label: "Gelöst",
    icon: CheckCircle,
    variant: "default" as const,
  },
  wont_fix: {
    label: "Wird nicht behoben",
    icon: XCircle,
    variant: "outline" as const,
  },
}

const areaLabels: Record<string, string> = {
  dashboard: "Mitfahrbörse",
  messages: "Nachrichten",
  profile: "Profil",
  settings: "Einstellungen",
  "route-search": "Routensuche",
  map: "Karte",
  notifications: "Benachrichtigungen",
  other: "Sonstiges",
}

export function BugReportsTable() {
  const [bugReports, setBugReports] = useState<BugReportWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("open")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<BugReportWithUser | null>(null)

  useEffect(() => {
    loadBugReports()
  }, [statusFilter])

  async function loadBugReports() {
    setIsLoading(true)
    try {
      const url =
        statusFilter === "all"
          ? "/api/bug-report?admin=true"
          : `/api/bug-report?admin=true&status=${statusFilter}`

      const response = await fetch(url)
      const { data, error } = await response.json()

      if (error) throw new Error(error)

      setBugReports(data || [])
    } catch (error) {
      console.error("Error loading bug reports:", error)
      toast.error("Fehler beim Laden der Bug Reports")
    } finally {
      setIsLoading(false)
    }
  }

  async function updateStatus(reportId: string, newStatus: string) {
    setActionLoading(reportId)
    try {
      const response = await fetch(`/api/bug-report/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const { error } = await response.json()
      if (error) throw new Error(error)

      setBugReports((prev) =>
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
            <SelectItem value="open">Offen</SelectItem>
            <SelectItem value="in_progress">In Bearbeitung</SelectItem>
            <SelectItem value="resolved">Gelöst</SelectItem>
            <SelectItem value="wont_fix">Wird nicht behoben</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {bugReports.length === 0 ? (
        <div className="text-center py-12">
          <Bug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Keine Bug Reports</h3>
          <p className="text-sm text-muted-foreground">
            Es gibt keine Bug Reports mit diesem Status.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Bereich</TableHead>
                <TableHead>Gemeldet von</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bugReports.map((report) => {
                const status = statusConfig[report.status as keyof typeof statusConfig]
                const StatusIcon = status?.icon || Clock

                return (
                  <TableRow
                    key={report.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedReport(report)}
                  >
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium truncate">{report.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {report.description.slice(0, 50)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {areaLabels[report.area] || report.area}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={report.user?.avatar_url || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(report.user)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {getDisplayName(report.user)}
                        </span>
                      </div>
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
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuLabel>Status ändern</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => updateStatus(report.id, "in_progress")}
                          >
                            <Wrench className="h-4 w-4 mr-2" />
                            In Bearbeitung
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus(report.id, "resolved")}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Als gelöst markieren
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus(report.id, "wont_fix")}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Wird nicht behoben
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              {selectedReport?.title}
            </DialogTitle>
            <DialogDescription>
              Gemeldet am {selectedReport && format(new Date(selectedReport.created_at), "dd. MMMM yyyy 'um' HH:mm", { locale: de })}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                {/* Meta Info */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {areaLabels[selectedReport.area] || selectedReport.area}
                  </Badge>
                  <Badge variant={statusConfig[selectedReport.status as keyof typeof statusConfig]?.variant || "secondary"}>
                    {statusConfig[selectedReport.status as keyof typeof statusConfig]?.label || selectedReport.status}
                  </Badge>
                </div>

                {/* Reporter */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Gemeldet von</h4>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedReport.user?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(selectedReport.user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{getDisplayName(selectedReport.user)}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Beschreibung</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedReport.description}
                  </p>
                </div>

                {/* Worked Before */}
                {selectedReport.worked_before && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Hat es vorher funktioniert?</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {selectedReport.worked_before}
                    </p>
                  </div>
                )}

                {/* Expected Behavior */}
                {selectedReport.expected_behavior && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Erwartetes Verhalten</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {selectedReport.expected_behavior}
                    </p>
                  </div>
                )}

                {/* Screencast */}
                {selectedReport.screencast_url && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Screencast</h4>
                    <a
                      href={selectedReport.screencast_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Video öffnen
                    </a>
                  </div>
                )}

                {/* Screenshots */}
                {selectedReport.screenshots && selectedReport.screenshots.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Screenshots ({selectedReport.screenshots.length})</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedReport.screenshots.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={url}
                            alt={`Screenshot ${index + 1}`}
                            className="rounded-md border w-full h-auto hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Agent */}
                {selectedReport.user_agent && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Browser / System</h4>
                    <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded-md break-all">
                      {selectedReport.user_agent}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
