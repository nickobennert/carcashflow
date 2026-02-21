"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import {
  Users,
  Car,
  MessageSquare,
  Flag,
  Eye,
  Ban,
  Check,
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  MoreHorizontal,
  RefreshCw,
  Bug,
  BookOpen,
  ExternalLink,
  ScrollText,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { staggerContainer, staggerItem } from "@/lib/animations"
import type { Profile } from "@/types"

interface Stats {
  totalUsers: number
  activeRides: number
  totalMessages: number
  pendingReports: number
  openBugReports: number
  newUsersToday: number
  newUsersWeek: number
}

interface UserRow {
  id: string
  username: string
  email: string | null
  first_name: string | null
  last_name: string | null
  is_banned: boolean | null
  created_at: string
  last_seen_at: string | null
}

interface ReportRow {
  id: string
  reason: string
  description: string | null
  status: string
  created_at: string
  reporter: { username: string } | null
  reported_user: { username: string } | null
}

interface BugReportRow {
  id: string
  title: string
  area: string
  description: string
  worked_before: string | null
  expected_behavior: string | null
  screenshots: string[] | null
  status: string
  created_at: string
}

interface AuditEntry {
  id: string
  action: string
  target_type: string
  target_id: string
  details: Record<string, unknown>
  created_at: string
  admin: { id: string; username: string; first_name: string | null } | null
}

const auditActionLabels: Record<string, string> = {
  user_banned: "Nutzer gesperrt",
  user_unbanned: "Nutzer entsperrt",
  report_resolved: "Report gelöst",
  report_dismissed: "Report abgewiesen",
  bug_status_changed: "Bug-Status geändert",
  ride_deleted: "Fahrt gelöscht",
  user_updated: "Nutzer aktualisiert",
}

const bugAreaLabels: Record<string, string> = {
  dashboard: "Mitfahrbörse",
  messages: "Nachrichten",
  profile: "Profil",
  settings: "Einstellungen",
  "route-search": "Routensuche",
  "route-creation": "Routenerstellung",
  map: "Karte",
  notifications: "Benachrichtigungen",
  other: "Sonstiges",
}

// Stat Card Component - Clean Futuristic Design
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  accentColor = "emerald",
}: {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  accentColor?: "emerald" | "blue" | "violet" | "amber" | "rose"
}) {
  const colorMap = {
    emerald: {
      bg: "bg-offer/10",
      text: "text-offer",
      border: "border-offer/20",
    },
    blue: {
      bg: "bg-request/10",
      text: "text-request",
      border: "border-request/20",
    },
    violet: {
      bg: "bg-violet-500/10",
      text: "text-violet-500",
      border: "border-violet-500/20",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      border: "border-amber-500/20",
    },
    rose: {
      bg: "bg-rose-500/10",
      text: "text-rose-500",
      border: "border-rose-500/20",
    },
  }

  const colors = colorMap[accentColor]

  return (
    <motion.div variants={staggerItem}>
      <div className={`relative overflow-hidden rounded-xl border ${colors.border} bg-card p-5`}>
        {/* Background accent */}
        <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${colors.bg} blur-2xl`} />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}>
              <Icon className={`h-5 w-5 ${colors.text}`} />
            </div>
            {trend && trendValue && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                trend === "up" ? "text-offer" : trend === "down" ? "text-rose-500" : "text-muted-foreground"
              }`}>
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend === "down" ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Activity className="h-3 w-3" />
                )}
                {trendValue}
              </div>
            )}
          </div>

          {/* Value */}
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground/70">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Quick Action Card
function QuickActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  badge,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-start gap-4 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/50 w-full"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{title}</p>
          {badge !== undefined && badge > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  )
}

export function AdminTab({ profile }: { profile: Profile }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [bugReports, setBugReports] = useState<BugReportRow[]>([])
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [selectedBugReport, setSelectedBugReport] = useState<BugReportRow | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [bugActionLoading, setBugActionLoading] = useState<string | null>(null)
  const [banLoading, setBanLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const supabase = createClient()

  useEffect(() => {
    loadAdminData()
  }, [])

  async function loadAdminData(refresh = false) {
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      // Fetch stats from API (uses service role key to bypass RLS)
      const statsResponse = await fetch("/api/admin/stats")
      if (!statsResponse.ok) {
        throw new Error("Failed to fetch stats")
      }
      const statsData = await statsResponse.json()

      setStats({
        totalUsers: statsData.stats.totalUsers || 0,
        activeRides: statsData.stats.activeRides || 0,
        totalMessages: statsData.stats.totalMessages || 0,
        pendingReports: statsData.stats.pendingReports || 0,
        openBugReports: statsData.stats.openBugReports || 0,
        newUsersToday: statsData.stats.newUsersToday || 0,
        newUsersWeek: statsData.stats.newUsersWeek || 0,
      })

      // Load users from API
      const usersResponse = await fetch("/api/admin/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }

      // Load reports (via regular client for now - needs API if issues)
      const { data: reportsData } = await supabase
        .from("reports")
        .select(`
          id,
          reason,
          description,
          status,
          created_at,
          reporter:reporter_id(username),
          reported_user:reported_user_id(username)
        `)
        .order("created_at", { ascending: false })
        .limit(20)

      if (reportsData) {
        setReports(reportsData as unknown as ReportRow[])
      }

      // Load bug reports from API
      const bugReportsResponse = await fetch("/api/admin/bug-reports")
      if (bugReportsResponse.ok) {
        const bugReportsData = await bugReportsResponse.json()
        setBugReports(bugReportsData.bugReports || [])
      }

      // Load audit log
      const auditResponse = await fetch("/api/admin/audit-log?limit=30")
      if (auditResponse.ok) {
        const auditData = await auditResponse.json()
        setAuditEntries(auditData.entries || [])
      }

      if (refresh) {
        toast.success("Daten aktualisiert")
      }
    } catch (error) {
      console.error("Error loading admin data:", error)
      toast.error("Fehler beim Laden der Admin-Daten")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  async function handleResolveReport(reportId: string, action: "resolved" | "dismissed") {
    setActionLoading(reportId)

    try {
      const { error } = await supabase
        .from("reports")
        .update({
          status: action,
          resolved_at: new Date().toISOString(),
          resolved_by: profile.id,
        } as never)
        .eq("id", reportId)

      if (error) throw error

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: action } : r))
      )
      toast.success(action === "resolved" ? "Report gelöst" : "Report abgewiesen")
    } catch (error) {
      console.error("Error resolving report:", error)
      toast.error("Fehler beim Bearbeiten des Reports")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleBugStatusChange(bugId: string, newStatus: string) {
    setBugActionLoading(bugId)

    try {
      const response = await fetch("/api/admin/bug-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bugId, status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update bug report")
      }

      setBugReports((prev) =>
        prev.map((b) => (b.id === bugId ? { ...b, status: newStatus } : b))
      )

      // Update stats
      if (newStatus !== "open" && stats) {
        setStats({ ...stats, openBugReports: Math.max(0, stats.openBugReports - 1) })
      }

      const statusLabels: Record<string, string> = {
        in_progress: "In Bearbeitung",
        resolved: "Gelöst",
        wont_fix: "Wird nicht behoben",
      }
      toast.success(`Bug Report: ${statusLabels[newStatus] || newStatus}`)
    } catch (error) {
      console.error("Error updating bug report:", error)
      toast.error("Fehler beim Aktualisieren")
    } finally {
      setBugActionLoading(null)
    }
  }

  async function handleToggleBan(userId: string, currentlyBanned: boolean) {
    setBanLoading(userId)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: currentlyBanned ? "unban" : "ban" }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Aktualisieren")
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_banned: !currentlyBanned } : u
        )
      )

      // Update selected user if open
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_banned: !currentlyBanned })
      }

      toast.success(currentlyBanned ? "Nutzer entsperrt" : "Nutzer gesperrt")
    } catch (error) {
      console.error("Error toggling ban:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Aktualisieren")
    } finally {
      setBanLoading(null)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const pendingReports = reports.filter((r) => r.status === "pending")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Lade Admin-Daten...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Übersicht und Verwaltung deiner Plattform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href="/admin/docs" target="_blank">
              <BookOpen className="h-4 w-4 mr-2" />
              Docs
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAdminData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <StatCard
          title="Registrierte Nutzer"
          value={stats?.totalUsers || 0}
          subtitle={`+${stats?.newUsersWeek || 0} diese Woche`}
          icon={Users}
          trend="up"
          trendValue={`+${stats?.newUsersToday || 0} heute`}
          accentColor="blue"
        />
        <StatCard
          title="Aktive Fahrten"
          value={stats?.activeRides || 0}
          subtitle="Aktuell online"
          icon={Car}
          accentColor="emerald"
        />
        <StatCard
          title="Nachrichten"
          value={stats?.totalMessages || 0}
          subtitle="Gesamt gesendet"
          icon={MessageSquare}
          accentColor="violet"
        />
        <StatCard
          title="Offene Reports"
          value={stats?.pendingReports || 0}
          subtitle={stats?.pendingReports === 0 ? "Alles erledigt" : "Zu bearbeiten"}
          icon={Flag}
          trend={stats?.pendingReports === 0 ? "neutral" : "up"}
          trendValue={stats?.pendingReports === 0 ? "OK" : "Achtung"}
          accentColor={stats?.pendingReports === 0 ? "emerald" : "rose"}
        />
        <StatCard
          title="Bug Reports"
          value={stats?.openBugReports || 0}
          subtitle={stats?.openBugReports === 0 ? "Alles OK" : "Offen"}
          icon={Bug}
          trend={stats?.openBugReports === 0 ? "neutral" : "up"}
          trendValue={stats?.openBugReports === 0 ? "OK" : "Neu"}
          accentColor={stats?.openBugReports === 0 ? "emerald" : "amber"}
        />
      </motion.div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickActionCard
          title="Reports bearbeiten"
          description="Offene Meldungen prüfen"
          icon={Flag}
          badge={stats?.pendingReports}
          onClick={() => setActiveTab("reports")}
        />
        <QuickActionCard
          title="Bug Reports"
          description="Gemeldete Fehler anzeigen"
          icon={Bug}
          badge={stats?.openBugReports}
          onClick={() => setActiveTab("bugs")}
        />
        <QuickActionCard
          title="Nutzer verwalten"
          description="Alle Nutzer anzeigen"
          icon={Users}
          onClick={() => setActiveTab("users")}
        />
      </div>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 w-full sm:w-auto grid grid-cols-5 sm:inline-flex">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background px-2 sm:px-3">
            <Activity className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Übersicht</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-background px-2 sm:px-3">
            <Users className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nutzer</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-background px-2 sm:px-3 relative">
            <Flag className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Reports</span>
            {(stats?.pendingReports || 0) > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 sm:static sm:ml-2 h-4 w-4 sm:h-5 sm:w-auto sm:px-1.5 p-0 flex items-center justify-center text-[10px] sm:text-xs">
                {stats?.pendingReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bugs" className="data-[state=active]:bg-background px-2 sm:px-3 relative">
            <Bug className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Bugs</span>
            {(stats?.openBugReports || 0) > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 sm:static sm:ml-2 h-4 w-4 sm:h-5 sm:w-auto sm:px-1.5 p-0 flex items-center justify-center text-[10px] sm:text-xs">
                {stats?.openBugReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-background px-2 sm:px-3">
            <ScrollText className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Log</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Recent Users */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Neueste Nutzer</CardTitle>
                  <CardDescription>Zuletzt registrierte Accounts</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("users")}>
                  Alle anzeigen
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.first_name?.[0] || user.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {user.is_banned ? (
                        <Badge variant="destructive" className="text-xs">
                          Gesperrt
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Aktiv
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(user.created_at).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Reports */}
          {pendingReports.length > 0 && (
            <Card className="border-rose-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-rose-500" />
                    <CardTitle className="text-base">Offene Reports</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("reports")}>
                    Alle anzeigen
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingReports.slice(0, 3).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive" className="text-xs">
                            {report.reason}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          @{report.reporter?.username || "?"} → @{report.reported_user?.username || "?"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveReport(report.id, "dismissed")}
                          disabled={actionLoading === report.id}
                        >
                          Abweisen
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleResolveReport(report.id, "resolved")}
                          disabled={actionLoading === report.id}
                        >
                          {actionLoading === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Lösen"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Nutzerverwaltung</CardTitle>
                  <CardDescription>Alle registrierten Nutzer ({users.length})</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nutzer suchen..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-lg border overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nutzer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registriert</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {user.first_name?.[0] || user.username[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          {user.is_banned ? (
                            <Badge variant="destructive" className="text-xs">
                              Gesperrt
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Aktiv
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("de-DE")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Details anzeigen
                              </DropdownMenuItem>
                              {user.id !== profile.id && (
                                <DropdownMenuItem
                                  onClick={() => handleToggleBan(user.id, !!user.is_banned)}
                                  disabled={banLoading === user.id}
                                  className={user.is_banned ? "text-offer" : "text-destructive"}
                                >
                                  {banLoading === user.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : user.is_banned ? (
                                    <Check className="h-4 w-4 mr-2" />
                                  ) : (
                                    <Ban className="h-4 w-4 mr-2" />
                                  )}
                                  {user.is_banned ? "Entsperren" : "Sperren"}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Meldungen</CardTitle>
              <CardDescription>Gemeldete Nutzer und Inhalte bearbeiten</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Flag className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Keine Meldungen</p>
                  <p className="text-sm mt-1">Es gibt derzeit keine Meldungen zu bearbeiten</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-start justify-between p-4 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              report.status === "pending"
                                ? "destructive"
                                : report.status === "resolved"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {report.status === "pending"
                              ? "Offen"
                              : report.status === "resolved"
                              ? "Gelöst"
                              : "Abgewiesen"}
                          </Badge>
                          <span className="text-sm font-medium">{report.reason}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleDateString("de-DE")}
                          </span>
                        </div>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Von:</span>{" "}
                          @{report.reporter?.username || "Unbekannt"}{" "}
                          <span className="text-muted-foreground mx-1">→</span>{" "}
                          @{report.reported_user?.username || "Unbekannt"}
                        </p>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                            {report.description}
                          </p>
                        )}
                      </div>
                      {report.status === "pending" && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading === report.id}
                            onClick={() => handleResolveReport(report.id, "dismissed")}
                          >
                            Abweisen
                          </Button>
                          <Button
                            size="sm"
                            disabled={actionLoading === report.id}
                            onClick={() => handleResolveReport(report.id, "resolved")}
                          >
                            {actionLoading === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Lösen
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bug Reports Tab */}
        <TabsContent value="bugs">
          <Card>
            <CardHeader>
              <CardTitle>Bug Reports</CardTitle>
              <CardDescription>Von Nutzern gemeldete Fehler und Probleme</CardDescription>
            </CardHeader>
            <CardContent>
              {bugReports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Bug className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Keine Bug Reports</p>
                  <p className="text-sm mt-1">Es gibt derzeit keine gemeldeten Fehler</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bugReports.map((bug) => (
                    <div
                      key={bug.id}
                      className="flex items-start justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedBugReport(bug)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge
                            variant={
                              bug.status === "open"
                                ? "destructive"
                                : bug.status === "in_progress"
                                ? "secondary"
                                : "default"
                            }
                          >
                            {bug.status === "open"
                              ? "Offen"
                              : bug.status === "in_progress"
                              ? "In Bearbeitung"
                              : bug.status === "resolved"
                              ? "Gelöst"
                              : "Wird nicht behoben"}
                          </Badge>
                          <Badge variant="outline">{bugAreaLabels[bug.area] || bug.area}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(bug.created_at).toLocaleDateString("de-DE")}
                          </span>
                        </div>
                        <p className="font-medium text-sm truncate">{bug.title}</p>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {bug.description}
                        </p>
                      </div>
                      {(bug.status === "open" || bug.status === "in_progress") && (
                        <div className="flex gap-2 ml-4 shrink-0">
                          {bug.status === "open" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={bugActionLoading === bug.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBugStatusChange(bug.id, "in_progress")
                              }}
                            >
                              Bearbeiten
                            </Button>
                          )}
                          {bug.status === "in_progress" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={bugActionLoading === bug.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBugStatusChange(bug.id, "wont_fix")
                              }}
                            >
                              Kein Fix
                            </Button>
                          )}
                          <Button
                            size="sm"
                            disabled={bugActionLoading === bug.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleBugStatusChange(bug.id, "resolved")
                            }}
                          >
                            {bugActionLoading === bug.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Gelöst
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitätsprotokoll</CardTitle>
              <CardDescription>Letzte Admin-Aktionen</CardDescription>
            </CardHeader>
            <CardContent>
              {auditEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <ScrollText className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Noch keine Einträge</p>
                  <p className="text-sm mt-1">Admin-Aktionen werden hier protokolliert</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg border text-sm"
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-medium">
                          {entry.admin?.first_name?.[0] || entry.admin?.username?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {entry.admin?.first_name || entry.admin?.username || "Admin"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {auditActionLabels[entry.action] || entry.action}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.target_type}: {entry.target_id.substring(0, 8)}...
                          {entry.details && Object.keys(entry.details).length > 0 && (
                            <> &middot; {JSON.stringify(entry.details)}</>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(entry.created_at).toLocaleString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Bug Report Detail Dialog */}
      <Dialog open={!!selectedBugReport} onOpenChange={() => setSelectedBugReport(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              {selectedBugReport?.title}
            </DialogTitle>
            <DialogDescription>
              Gemeldet am {selectedBugReport && new Date(selectedBugReport.created_at).toLocaleDateString("de-DE")}
            </DialogDescription>
          </DialogHeader>
          {selectedBugReport && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{bugAreaLabels[selectedBugReport.area] || selectedBugReport.area}</Badge>
                <Badge
                  variant={
                    selectedBugReport.status === "open"
                      ? "destructive"
                      : selectedBugReport.status === "in_progress"
                      ? "secondary"
                      : "default"
                  }
                >
                  {selectedBugReport.status === "open"
                    ? "Offen"
                    : selectedBugReport.status === "in_progress"
                    ? "In Bearbeitung"
                    : selectedBugReport.status === "resolved"
                    ? "Gelöst"
                    : "Wird nicht behoben"}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Beschreibung</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {selectedBugReport.description}
                </p>
              </div>

              {selectedBugReport.worked_before && (
                <div>
                  <p className="text-sm font-medium mb-1">Hat es vorher funktioniert?</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {selectedBugReport.worked_before}
                  </p>
                </div>
              )}

              {selectedBugReport.expected_behavior && (
                <div>
                  <p className="text-sm font-medium mb-1">Erwartetes Verhalten</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {selectedBugReport.expected_behavior}
                  </p>
                </div>
              )}

              {selectedBugReport.screenshots && selectedBugReport.screenshots.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Screenshots</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedBugReport.screenshots.map((url, index) => (
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
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedBugReport?.status === "open" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleBugStatusChange(selectedBugReport.id, "in_progress")
                    setSelectedBugReport(null)
                  }}
                >
                  In Bearbeitung
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleBugStatusChange(selectedBugReport.id, "wont_fix")
                    setSelectedBugReport(null)
                  }}
                >
                  Wird nicht behoben
                </Button>
                <Button
                  onClick={() => {
                    handleBugStatusChange(selectedBugReport.id, "resolved")
                    setSelectedBugReport(null)
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Gelöst
                </Button>
              </>
            )}
            {selectedBugReport?.status === "in_progress" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleBugStatusChange(selectedBugReport.id, "wont_fix")
                    setSelectedBugReport(null)
                  }}
                >
                  Wird nicht behoben
                </Button>
                <Button
                  onClick={() => {
                    handleBugStatusChange(selectedBugReport.id, "resolved")
                    setSelectedBugReport(null)
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Gelöst
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setSelectedBugReport(null)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nutzer Details</DialogTitle>
            <DialogDescription>@{selectedUser?.username}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-lg font-medium">
                    {selectedUser.first_name?.[0] || selectedUser.username[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  {selectedUser.is_banned ? (
                    <Badge variant="destructive">Gesperrt</Badge>
                  ) : (
                    <Badge variant="outline">Aktiv</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Registriert</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedUser.created_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Zuletzt aktiv</p>
                  <p className="text-sm font-medium">
                    {selectedUser.last_seen_at
                      ? new Date(selectedUser.last_seen_at).toLocaleDateString("de-DE")
                      : "Unbekannt"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedUser && selectedUser.id !== profile.id && (
              <Button
                variant={selectedUser.is_banned ? "default" : "destructive"}
                onClick={() => handleToggleBan(selectedUser.id, !!selectedUser.is_banned)}
                disabled={banLoading === selectedUser.id}
              >
                {banLoading === selectedUser.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : selectedUser.is_banned ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Ban className="h-4 w-4 mr-2" />
                )}
                {selectedUser.is_banned ? "Nutzer entsperren" : "Nutzer sperren"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
