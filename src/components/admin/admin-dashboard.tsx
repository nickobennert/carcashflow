"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import {
  Users,
  Car,
  MessageSquare,
  Flag,
  TrendingUp,
  Shield,
  Gift,
  RefreshCw,
  UserPlus,
  CreditCard,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ReportsTable } from "./reports-table"
import { UsersTable } from "./users-table"
import { PromoCodesTable } from "./promo-codes-table"
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations"

interface AdminDashboardProps {
  userId: string
  role: string
}

interface Stats {
  totalUsers: number
  activeRides: number
  totalMessages: number
  totalConversations: number
  pendingReports: number
  activePromoCodes: number
  newUsersToday: number
  newUsersWeek: number
  activeSubscriptions: number
  trialingUsers: number
  lifetimeUsers: number
}

interface RecentUser {
  id: string
  username: string
  first_name: string | null
  avatar_url: string | null
  created_at: string
}

interface PendingReport {
  id: string
  reason: string
  created_at: string
  reporter: { username: string } | null
}

export function AdminDashboard({ role }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [pendingReportsList, setPendingReportsList] = useState<PendingReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadStats = useCallback(async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setIsRefreshing(true)

      const response = await fetch("/api/admin/stats")

      if (!response.ok) {
        throw new Error("Failed to fetch stats")
      }

      const data = await response.json()

      setStats(data.stats)
      setRecentUsers(data.recentUsers || [])
      setPendingReportsList(data.pendingReportsList || [])

      if (showRefreshToast) {
        toast.success("Dashboard aktualisiert")
      }
    } catch (error) {
      console.error("Error loading stats:", error)
      if (showRefreshToast) {
        toast.error("Fehler beim Aktualisieren")
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Administrator",
    moderator: "Moderator",
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Übersicht und Verwaltung der Plattform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadStats(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
          <Badge variant="secondary" className="gap-2">
            <Shield className="h-3.5 w-3.5" />
            {roleLabels[role] || role}
          </Badge>
        </div>
      </div>

      {/* Stats Grid - Row 1: Main Stats */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : stats ? (
        <>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={staggerItem}>
              <StatCard
                title="Benutzer gesamt"
                value={stats.totalUsers}
                subValue={`+${stats.newUsersToday} heute, +${stats.newUsersWeek} diese Woche`}
                icon={Users}
                trend={stats.newUsersToday > 0 ? "up" : undefined}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <StatCard
                title="Aktive Routen"
                value={stats.activeRides}
                icon={Car}
                trend={stats.activeRides > 0 ? "up" : undefined}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <StatCard
                title="Konversationen"
                value={stats.totalConversations}
                subValue={`${stats.totalMessages} Nachrichten`}
                icon={MessageSquare}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <StatCard
                title="Offene Meldungen"
                value={stats.pendingReports}
                icon={Flag}
                highlight={stats.pendingReports > 0}
              />
            </motion.div>
          </motion.div>

          {/* Stats Grid - Row 2: Subscription Stats */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={staggerItem}>
              <StatCard
                title="Aktive Abos"
                value={stats.activeSubscriptions}
                icon={CreditCard}
                trend={stats.activeSubscriptions > 0 ? "up" : undefined}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <StatCard
                title="In Testphase"
                value={stats.trialingUsers}
                icon={UserPlus}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <StatCard
                title="Lifetime"
                value={stats.lifetimeUsers}
                icon={Sparkles}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <StatCard
                title="Aktive Promo Codes"
                value={stats.activePromoCodes}
                icon={Gift}
              />
            </motion.div>
          </motion.div>

          {/* Quick Info Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Users */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Neue Benutzer</CardTitle>
                <CardDescription>Zuletzt registriert</CardDescription>
              </CardHeader>
              <CardContent>
                {recentUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine neuen Benutzer</p>
                ) : (
                  <div className="space-y-3">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {user.first_name?.[0] || user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {user.first_name || user.username}
                            </p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Reports */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Offene Meldungen</CardTitle>
                <CardDescription>Erfordert Überprüfung</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingReportsList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine offenen Meldungen</p>
                ) : (
                  <div className="space-y-3">
                    {pendingReportsList.map((report) => (
                      <div key={report.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4 text-amber-500" />
                          <div>
                            <p className="text-sm font-medium capitalize">{report.reason}</p>
                            <p className="text-xs text-muted-foreground">
                              von @{report.reporter?.username || "Unbekannt"}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {/* Main Content Tabs */}
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports" className="gap-2">
            <Flag className="h-4 w-4" />
            Meldungen
            {stats && stats.pendingReports > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                {stats.pendingReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Benutzer
          </TabsTrigger>
          <TabsTrigger value="promo-codes" className="gap-2">
            <Gift className="h-4 w-4" />
            Promo Codes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Meldungen</CardTitle>
              <CardDescription>
                Überprüfe und bearbeite eingereichte Meldungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Benutzer</CardTitle>
              <CardDescription>
                Verwalte Benutzerkonten und Berechtigungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promo-codes">
          <Card>
            <CardHeader>
              <CardTitle>Promo Codes</CardTitle>
              <CardDescription>
                Erstelle und verwalte Gutscheincodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromoCodesTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

interface StatCardProps {
  title: string
  value: number
  subValue?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: "up" | "down"
  highlight?: boolean
}

function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  highlight,
}: StatCardProps) {
  return (
    <Card className={highlight ? "border-destructive" : undefined}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Icon
              className={`h-5 w-5 ${
                highlight ? "text-destructive" : "text-muted-foreground"
              }`}
            />
          </div>
          {trend && (
            <TrendingUp
              className={`h-4 w-4 ${
                trend === "up" ? "text-emerald-500" : "text-red-500 rotate-180"
              }`}
            />
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value.toLocaleString("de-DE")}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
