import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/reports/[id] - Get a specific report
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if user is admin
    const { data: adminData } = await supabase
      .from("super_admins")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const isAdmin = !!adminData

    const { data, error } = await supabase
      .from("reports")
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey (
          id, username, first_name, last_name, avatar_url
        ),
        reported_user:profiles!reports_reported_user_id_fkey (
          id, username, first_name, last_name, avatar_url
        ),
        reported_ride:rides!reports_reported_ride_id_fkey (
          id, type, route, departure_date
        ),
        resolver:profiles!reports_resolved_by_fkey (
          id, username, first_name, last_name
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 }
        )
      }
      throw error
    }

    const report = data as { reporter_id: string } | null

    // Only allow access to own reports or if admin
    if (!isAdmin && report?.reporter_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to view this report" },
        { status: 403 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching report:", error)
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    )
  }
}

// PATCH /api/reports/[id] - Update report status (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verify admin status
    const { data: adminData } = await supabase
      .from("super_admins")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (!adminData) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, admin_notes } = body

    const validStatuses = ["pending", "reviewed", "resolved", "dismissed"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes

    // Set resolved info if resolving
    if (status === "resolved" || status === "dismissed") {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    }

    const { data, error } = await supabase
      .from("reports")
      .update(updateData as never)
      .eq("id", id)
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey (
          id, username, first_name, last_name, avatar_url
        ),
        reported_user:profiles!reports_reported_user_id_fkey (
          id, username, first_name, last_name, avatar_url
        )
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error updating report:", error)
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    )
  }
}

// DELETE /api/reports/[id] - Delete a report (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verify admin status
    const { data: adminData } = await supabase
      .from("super_admins")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (!adminData) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const { error } = await supabase.from("reports").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Report deleted" })
  } catch (error) {
    console.error("Error deleting report:", error)
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    )
  }
}
