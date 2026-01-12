"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import {
  Users,
  Car,
  MessageSquare,
  Flag,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Gift,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  activeUsers: number
  totalRides: number
  activeRides: number
  totalConversations: number
  pendingReports: number
  totalReports: number
}

export function AdminDashboard({ userId, role }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadStats() {
      try {
        // Fetch stats in parallel
        const [usersResult, ridesResult, conversationsResult, reportsResult] =
          await Promise.all([
            supabase.from("profiles").select("id, last_seen_at", { count: "exact" }),
            supabase.from("rides").select("id, status", { count: "exact" }),
            supabase.from("conversations").select("id", { count: "exact" }),
            supabase.from("reports").select("id, status", { count: "exact" }),
          ])

        // Calculate stats
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const activeUsers = (usersResult.data || []).filter((u) => {
          const user = u as { last_seen_at: string | null }
          return user.last_seen_at && new Date(user.last_seen_at) > thirtyDaysAgo
        }).length

        const activeRides = (ridesResult.data || []).filter((r) => {
          const ride = r as { status: string }
          return ride.status === "active"
        }).length

        const pendingReports = (reportsResult.data || []).filter((r) => {
          const report = r as { status: string }
          return report.status === "pending"
        }).length

        setStats({
          totalUsers: usersResult.count || 0,
          activeUsers,
          totalRides: ridesResult.count || 0,
          activeRides,
          totalConversations: conversationsResult.count || 0,
          pendingReports,
          totalReports: reportsResult.count || 0,
        })
      } catch (error) {
        console.error("Error loading stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [supabase])

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
        <Badge variant="secondary" className="gap-2">
          <Shield className="h-3.5 w-3.5" />
          {roleLabels[role] || role}
        </Badge>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : stats ? (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={staggerItem}>
            <StatCard
              title="Benutzer"
              value={stats.totalUsers}
              subValue={`${stats.activeUsers} aktiv (30 Tage)`}
              icon={Users}
              trend={stats.activeUsers > 0 ? "up" : undefined}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              title="Routen"
              value={stats.totalRides}
              subValue={`${stats.activeRides} aktiv`}
              icon={Car}
              trend={stats.activeRides > 0 ? "up" : undefined}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              title="Konversationen"
              value={stats.totalConversations}
              icon={MessageSquare}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              title="Offene Meldungen"
              value={stats.pendingReports}
              subValue={`${stats.totalReports} insgesamt`}
              icon={Flag}
              highlight={stats.pendingReports > 0}
            />
          </motion.div>
        </motion.div>
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
