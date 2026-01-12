import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/reports - Get user's submitted reports (or all reports for admins)
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status")
  const isAdmin = searchParams.get("admin") === "true"

  try {
    // Check if user is admin
    const { data: adminData } = await supabase
      .from("super_admins")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const admin = adminData as { role: string } | null
    const isAdminUser = !!admin

    let query = supabase
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
        )
      `)
      .order("created_at", { ascending: false })

    // If admin and requesting admin view, show all reports
    // Otherwise, show only user's own reports
    if (!isAdminUser || !isAdmin) {
      query = query.eq("reporter_id", user.id)
    }

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      data,
      isAdmin: isAdminUser,
    })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    )
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { reported_user_id, reported_ride_id, reason, description } = body

    // Validate required fields
    if (!reason) {
      return NextResponse.json(
        { error: "reason is required" },
        { status: 400 }
      )
    }

    if (!reported_user_id && !reported_ride_id) {
      return NextResponse.json(
        { error: "Either reported_user_id or reported_ride_id is required" },
        { status: 400 }
      )
    }

    const validReasons = ["spam", "inappropriate", "fake", "harassment", "other"]
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid reason" },
        { status: 400 }
      )
    }

    // Prevent self-reporting
    if (reported_user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot report yourself" },
        { status: 400 }
      )
    }

    // Check if user already reported this target
    let existingQuery = supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("status", "pending")

    if (reported_user_id) {
      existingQuery = existingQuery.eq("reported_user_id", reported_user_id)
    }
    if (reported_ride_id) {
      existingQuery = existingQuery.eq("reported_ride_id", reported_ride_id)
    }

    const { data: existingReport } = await existingQuery.single()

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this", data: existingReport },
        { status: 409 }
      )
    }

    // Create the report
    const { data, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        reported_user_id: reported_user_id || null,
        reported_ride_id: reported_ride_id || null,
        reason,
        description: description || null,
        status: "pending",
      } as never)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("Error creating report:", error)
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    )
  }
}
