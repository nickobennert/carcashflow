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

// GET /api/bug-reports - Get bug reports
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isUserAdmin = await isAdmin(user.id)
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build query
    let query = supabaseAdmin
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
      `, { count: "exact" })

    // Non-admins can only see their own reports
    if (!isUserAdmin) {
      query = query.eq("user_id", user.id)
    }

    // Filter by status if provided
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching bug reports:", error)
      return NextResponse.json({ error: "Failed to fetch bug reports" }, { status: 500 })
    }

    return NextResponse.json({
      data,
      isAdmin: isUserAdmin,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false,
      },
    })
  } catch (error) {
    console.error("Error in GET /api/bug-reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/bug-reports - Create a new bug report
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, area, screenshot_url } = body

    if (!title || !description || !area) {
      return NextResponse.json(
        { error: "Title, description, and area are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("bug_reports")
      .insert({
        user_id: user.id,
        title,
        description,
        area,
        screenshot_url: screenshot_url || null,
        status: "open",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating bug report:", error)
      return NextResponse.json({ error: "Failed to create bug report" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in POST /api/bug-reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
