"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import {
  Users,
  Car,
  MessageSquare,
  Flag,
  Gift,
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
} from "lucide-react"
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
  activePromoCodes: number
  newUsersToday: number
  newUsersWeek: number
}

interface UserRow {
  id: string
  username: string
  email: string | null
  first_name: string | null
  last_name: string | null
  subscription_tier: string | null
  subscription_status: string | null
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

interface PromoCodeRow {
  id: string
  code: string
  type: string
  value: number | null
  max_uses: number | null
  current_uses: number
  is_active: boolean
  valid_until: string | null
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
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      border: "border-emerald-500/20",
    },
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      border: "border-blue-500/20",
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
                trend === "up" ? "text-emerald-500" : trend === "down" ? "text-rose-500" : "text-muted-foreground"
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
  const [promoCodes, setPromoCodes] = useState<PromoCodeRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
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
      // Calculate date ranges
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Load stats
      const [
        usersCount,
        ridesCount,
        messagesCount,
        reportsCount,
        promoCount,
        newUsersToday,
        newUsersWeek,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("rides").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("promo_codes").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      ])

      setStats({
        totalUsers: usersCount.count || 0,
        activeRides: ridesCount.count || 0,
        totalMessages: messagesCount.count || 0,
        pendingReports: reportsCount.count || 0,
        activePromoCodes: promoCount.count || 0,
        newUsersToday: newUsersToday.count || 0,
        newUsersWeek: newUsersWeek.count || 0,
      })

      // Load users
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, username, email, first_name, last_name, subscription_tier, subscription_status, created_at, last_seen_at")
        .order("created_at", { ascending: false })
        .limit(50)

      if (usersData) {
        setUsers(usersData as UserRow[])
      }

      // Load reports
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

      // Load promo codes
      const { data: promoData } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

      if (promoData) {
        setPromoCodes(promoData as PromoCodeRow[])
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

  async function handleTogglePromoCode(codeId: string, isActive: boolean) {
    setActionLoading(codeId)

    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !isActive } as never)
        .eq("id", codeId)

      if (error) throw error

      setPromoCodes((prev) =>
        prev.map((c) => (c.id === codeId ? { ...c, is_active: !isActive } : c))
      )
      toast.success(isActive ? "Code deaktiviert" : "Code aktiviert")
    } catch (error) {
      console.error("Error toggling promo code:", error)
      toast.error("Fehler beim Ändern des Codes")
    } finally {
      setActionLoading(null)
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadAdminData(true)}
          disabled={isRefreshing}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
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
          title="Nutzer verwalten"
          description="Alle Nutzer anzeigen"
          icon={Users}
          onClick={() => setActiveTab("users")}
        />
        <QuickActionCard
          title="Promo Codes"
          description={`${stats?.activePromoCodes || 0} aktive Codes`}
          icon={Gift}
          onClick={() => setActiveTab("promos")}
        />
      </div>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background">
            <Activity className="h-4 w-4 mr-2" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-background">
            <Users className="h-4 w-4 mr-2" />
            Nutzer
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-background">
            <Flag className="h-4 w-4 mr-2" />
            Reports
            {(stats?.pendingReports || 0) > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {stats?.pendingReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="promos" className="data-[state=active]:bg-background">
            <Gift className="h-4 w-4 mr-2" />
            Promo Codes
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
                      <Badge variant="outline" className="text-xs">
                        {user.subscription_tier || "trial"}
                      </Badge>
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

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nutzer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
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
                          <Badge variant="outline" className="text-xs">
                            {user.subscription_tier || "trial"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.subscription_status === "active" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {user.subscription_status || "trialing"}
                          </Badge>
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

        {/* Promo Codes Tab */}
        <TabsContent value="promos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Promo Codes</CardTitle>
                  <CardDescription>Aktive und verwendete Promo Codes verwalten</CardDescription>
                </div>
                <Button size="sm" disabled>
                  <Gift className="h-4 w-4 mr-2" />
                  Neuer Code
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {promoCodes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Gift className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Keine Promo Codes</p>
                  <p className="text-sm mt-1">Erstelle deinen ersten Promo Code</p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Verwendungen</TableHead>
                        <TableHead>Gültig bis</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promoCodes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono font-medium">
                            {code.code}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{code.type}</Badge>
                          </TableCell>
                          <TableCell>
                            {code.current_uses}
                            {code.max_uses && ` / ${code.max_uses}`}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {code.valid_until
                              ? new Date(code.valid_until).toLocaleDateString("de-DE")
                              : "Unbegrenzt"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={code.is_active ? "default" : "secondary"}>
                              {code.is_active ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoading === code.id}
                              onClick={() => handleTogglePromoCode(code.id, code.is_active)}
                            >
                              {actionLoading === code.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : code.is_active ? (
                                <Ban className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <Badge variant="outline">
                    {selectedUser.subscription_tier || "trial"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={selectedUser.subscription_status === "active" ? "default" : "secondary"}>
                    {selectedUser.subscription_status || "trialing"}
                  </Badge>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
