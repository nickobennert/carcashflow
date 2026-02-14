import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/bug-report/[id] - Get single bug report (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { id } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminData } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!adminData) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get bug report with user info
    const { data: bugReport, error } = await adminClient
      .from("bug_reports")
      .select(`
        *,
        user:profiles!bug_reports_user_id_fkey (
          id, username, first_name, last_name, email, avatar_url
        )
      `)
      .eq("id", id)
      .single()

    if (error || !bugReport) {
      return NextResponse.json({ error: "Bug-Report nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json({ data: bugReport })
  } catch (error) {
    console.error("Error in GET /api/bug-report/[id]:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

// PATCH /api/bug-report/[id] - Update bug report status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { id } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminData } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!adminData) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { status, admin_notes } = body

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (status) {
      updateData.status = status
      if (status === "resolved" || status === "wont_fix") {
        updateData.resolved_at = new Date().toISOString()
        updateData.resolved_by = user.id
      }
    }
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    const { data: bugReport, error } = await adminClient
      .from("bug_reports")
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating bug report:", error)
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren" },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: bugReport })
  } catch (error) {
    console.error("Error in PATCH /api/bug-report/[id]:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

// DELETE /api/bug-report/[id] - Delete bug report and all associated files (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { id } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminData } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!adminData) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // First, get the bug report to find screenshot URLs
    const { data: bugReportData } = await adminClient
      .from("bug_reports")
      .select("screenshots")
      .eq("id", id)
      .single()

    if (!bugReportData) {
      return NextResponse.json({ error: "Bug-Report nicht gefunden" }, { status: 404 })
    }

    const bugReport = bugReportData as { screenshots: string[] | null }

    // Delete screenshots from storage
    const screenshots = bugReport.screenshots
    if (screenshots && screenshots.length > 0) {
      // Extract file paths from URLs
      const filePaths = screenshots
        .map((url) => {
          // URL format: https://xxx.supabase.co/storage/v1/object/public/uploads/bug-reports/...
          const match = url.match(/\/uploads\/(.+)$/)
          return match ? match[1] : null
        })
        .filter(Boolean) as string[]

      if (filePaths.length > 0) {
        const { error: deleteError } = await adminClient.storage
          .from("uploads")
          .remove(filePaths)

        if (deleteError) {
          console.error("Error deleting screenshots:", deleteError)
          // Continue anyway - we still want to delete the DB record
        }
      }
    }

    // Delete the bug report from database
    const { error } = await adminClient
      .from("bug_reports")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting bug report:", error)
      return NextResponse.json(
        { error: "Fehler beim Löschen des Bug-Reports" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/bug-report/[id]:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
