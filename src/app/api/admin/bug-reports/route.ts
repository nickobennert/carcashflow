import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/audit"

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

// GET /api/admin/bug-reports - Get all bug reports
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

    const { data: bugReports, error } = await supabaseAdmin
      .from("bug_reports")
      .select(`
        id,
        title,
        area,
        description,
        worked_before,
        expected_behavior,
        screenshots,
        status,
        created_at,
        user_id,
        user:profiles!bug_reports_user_id_fkey (
          id,
          username,
          first_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching bug reports:", error)
      return NextResponse.json({ error: "Failed to fetch bug reports" }, { status: 500 })
    }

    return NextResponse.json({ bugReports: bugReports || [] })
  } catch (error) {
    console.error("Error in bug reports API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/admin/bug-reports - Update bug report status
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id, status, admin_notes } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { status }

    if (status === "resolved" || status === "wont_fix") {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    const { error } = await supabaseAdmin
      .from("bug_reports")
      .update(updateData)
      .eq("id", id)

    if (error) {
      console.error("Error updating bug report:", error)
      return NextResponse.json({ error: "Failed to update bug report" }, { status: 500 })
    }

    // Audit log
    logAuditEvent({
      admin_id: user.id,
      action: "bug_status_changed",
      target_type: "bug_report",
      target_id: id,
      details: { new_status: status, admin_notes: admin_notes || null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in bug reports PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
