import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Helper to check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const supabaseAdmin = createAdminClient()
  const { data } = await supabaseAdmin
    .from("super_admins")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  return !!data
}

// GET /api/admin/audit-log - Get audit log entries
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")

    const supabaseAdmin = createAdminClient()

    const { data: entries, error, count } = await supabaseAdmin
      .from("audit_log")
      .select(`
        id,
        action,
        target_type,
        target_id,
        details,
        created_at,
        admin:profiles!audit_log_admin_id_fkey (
          id,
          username,
          first_name
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching audit log:", error)
      return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 })
    }

    return NextResponse.json({
      entries: entries || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error in audit log API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
