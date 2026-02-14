import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("super_admins")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  return !!data
}

// GET /api/admin/stats - Get platform statistics
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)
    const weekAgoISO = weekAgo.toISOString()

    // Execute all queries in parallel
    const [
      { count: totalUsers },
      { count: activeRides },
      { count: totalMessages },
      { count: totalConversations },
      { count: pendingReports },
      { count: openBugReports },
      { count: newUsersToday },
      { count: newUsersWeek },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("rides").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("messages").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("conversations").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("bug_reports").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgoISO),
    ])

    // Get recent users
    const { data: recentUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, username, first_name, last_name, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    // Get pending reports
    const { data: pendingReportsList } = await supabaseAdmin
      .from("reports")
      .select(`
        id,
        reason,
        description,
        created_at,
        reporter:profiles!reports_reporter_id_fkey (
          id, username, first_name, last_name
        ),
        reported_user:profiles!reports_reported_user_id_fkey (
          id, username, first_name, last_name
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5)

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        activeRides: activeRides || 0,
        totalMessages: totalMessages || 0,
        totalConversations: totalConversations || 0,
        pendingReports: pendingReports || 0,
        openBugReports: openBugReports || 0,
        newUsersToday: newUsersToday || 0,
        newUsersWeek: newUsersWeek || 0,
      },
      recentUsers: recentUsers || [],
      pendingReportsList: pendingReportsList || [],
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
