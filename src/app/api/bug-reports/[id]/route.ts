import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

const supabaseAdmin = createAdminClient(
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

// GET /api/bug-reports/[id] - Get a single bug report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isUserAdmin = await isAdmin(user.id)

    const { data, error } = await supabaseAdmin
      .from("bug_reports")
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching bug report:", error)
      return NextResponse.json({ error: "Bug report not found" }, { status: 404 })
    }

    // Non-admins can only view their own reports
    if (!isUserAdmin && data.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ data, isAdmin: isUserAdmin })
  } catch (error) {
    console.error("Error in GET /api/bug-reports/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/bug-reports/[id] - Update a bug report (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { status, admin_notes } = body

    const updateData: Record<string, unknown> = {}

    if (status) {
      updateData.status = status
      if (status === "resolved" || status === "closed") {
        updateData.resolved_at = new Date().toISOString()
        updateData.resolved_by = user.id
      }
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    const { data, error } = await supabaseAdmin
      .from("bug_reports")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating bug report:", error)
      return NextResponse.json({ error: "Failed to update bug report" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in PUT /api/bug-reports/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/bug-reports/[id] - Delete a bug report (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get the bug report to find screenshot URL
    const { data: report } = await supabaseAdmin
      .from("bug_reports")
      .select("screenshot_url")
      .eq("id", id)
      .single()

    // Delete screenshot from storage if exists
    if (report?.screenshot_url) {
      try {
        // Extract path from URL
        const url = new URL(report.screenshot_url)
        const pathMatch = url.pathname.match(/\/bug-screenshots\/(.+)$/)
        if (pathMatch) {
          await supabaseAdmin.storage
            .from("bug-screenshots")
            .remove([pathMatch[1]])
        }
      } catch (storageError) {
        console.error("Error deleting screenshot:", storageError)
        // Continue with deletion even if screenshot removal fails
      }
    }

    // Delete the bug report
    const { error } = await supabaseAdmin
      .from("bug_reports")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting bug report:", error)
      return NextResponse.json({ error: "Failed to delete bug report" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/bug-reports/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
