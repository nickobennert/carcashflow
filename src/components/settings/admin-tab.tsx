"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import {
  Users,
  Car,
  MessageSquare,
  Flag,
  Gift,
  TrendingUp,
  Eye,
  Ban,
  Check,
  Search,
  Loader2,
  AlertTriangle,
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
import { staggerContainer, staggerItem } from "@/lib/animations"
import type { Profile } from "@/types"

interface Stats {
  totalUsers: number
  activeRides: number
  totalMessages: number
  pendingReports: number
  activePromoCodes: number
}

interface UserRow {
  id: string
  username: string
  email: string | null
  first_name: string | null
  last_name: string | null
  subscription_tier: string | null
  created_at: string
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

export function AdminTab({ profile }: { profile: Profile }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [promoCodes, setPromoCodes] = useState<PromoCodeRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userSearch, setUserSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadAdminData()
  }, [])

  async function loadAdminData() {
    setIsLoading(true)

    try {
      // Load stats
      const [usersCount, ridesCount, messagesCount, reportsCount, promoCount] =
        await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase
            .from("rides")
            .select("id", { count: "exact", head: true })
            .eq("status", "active"),
          supabase.from("messages").select("id", { count: "exact", head: true }),
          supabase
            .from("reports")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("promo_codes")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
        ])

      setStats({
        totalUsers: usersCount.count || 0,
        activeRides: ridesCount.count || 0,
        totalMessages: messagesCount.count || 0,
        pendingReports: reportsCount.count || 0,
        activePromoCodes: promoCount.count || 0,
      })

      // Load users
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, username, email, first_name, last_name, subscription_tier, created_at")
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
    } catch (error) {
      console.error("Error loading admin data:", error)
      toast.error("Fehler beim Laden der Admin-Daten")
    } finally {
      setIsLoading(false)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        {[
          { label: "Nutzer", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500" },
          { label: "Aktive Fahrten", value: stats?.activeRides || 0, icon: Car, color: "text-green-500" },
          { label: "Nachrichten", value: stats?.totalMessages || 0, icon: MessageSquare, color: "text-purple-500" },
          { label: "Offene Reports", value: stats?.pendingReports || 0, icon: Flag, color: "text-red-500" },
          { label: "Promo Codes", value: stats?.activePromoCodes || 0, icon: Gift, color: "text-amber-500" },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Nutzer
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <Flag className="h-4 w-4" />
            Reports
            {(stats?.pendingReports || 0) > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {stats?.pendingReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="promos" className="gap-2">
            <Gift className="h-4 w-4" />
            Promo Codes
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Nutzerverwaltung</CardTitle>
              <CardDescription>Alle registrierten Nutzer verwalten</CardDescription>
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nutzer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Registriert</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @{user.username}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.subscription_tier || "trial"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("de-DE")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
              <CardDescription>Gemeldete Nutzer und Inhalte</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Keine Meldungen vorhanden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-start justify-between p-4 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
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
                          <span className="text-sm text-muted-foreground">
                            {report.reason}
                          </span>
                        </div>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Von:</span>{" "}
                          @{report.reporter?.username || "Unbekannt"}{" "}
                          <span className="text-muted-foreground">→</span>{" "}
                          @{report.reported_user?.username || "Unbekannt"}
                        </p>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mt-1">
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
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Lösen
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
              <CardTitle>Promo Codes</CardTitle>
              <CardDescription>Aktive und verwendete Promo Codes</CardDescription>
            </CardHeader>
            <CardContent>
              {promoCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Keine Promo Codes vorhanden</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Verwendungen</TableHead>
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
                          <TableCell>
                            <Badge
                              variant={code.is_active ? "default" : "secondary"}
                            >
                              {code.is_active ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoading === code.id}
                              onClick={() =>
                                handleTogglePromoCode(code.id, code.is_active)
                              }
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nutzer Details</DialogTitle>
            <DialogDescription>
              @{selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Plan</p>
                  <p className="font-medium">
                    {selectedUser.subscription_tier || "trial"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registriert</p>
                  <p className="font-medium">
                    {new Date(selectedUser.created_at).toLocaleDateString("de-DE")}
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
