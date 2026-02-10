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

// GET /api/admin/users - Get all users (admin only)
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

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const supabaseAdmin = createAdminClient()
    let query = supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact" })

    // Filter by ban status
    if (status === "banned") {
      query = query.eq("is_banned", true)
    } else if (status === "active") {
      query = query.or("is_banned.is.null,is_banned.eq.false")
    }

    // Search by name, email, or username
    // Sanitize search input to prevent LIKE pattern injection
    if (search) {
      const sanitized = search
        .slice(0, 100) // Limit length
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")
      query = query.or(`username.ilike.%${sanitized}%,email.ilike.%${sanitized}%,first_name.ilike.%${sanitized}%,last_name.ilike.%${sanitized}%`)
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Fetch legal acceptances for all users in the result
    const userIds = (data || []).map((u: { id: string }) => u.id)
    const { data: acceptances } = await supabaseAdmin
      .from("legal_acceptances")
      .select("user_id, acceptance_type, version, accepted_at, ip_address")
      .in("user_id", userIds)
      .eq("acceptance_type", "rideshare_terms")

    // Create a map for quick lookup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acceptancesList = (acceptances || []) as any[]
    const acceptanceMap = new Map<string, { version: string; accepted_at: string; ip_address: string | null }>()
    for (const acc of acceptancesList) {
      acceptanceMap.set(acc.user_id, {
        version: acc.version,
        accepted_at: acc.accepted_at,
        ip_address: acc.ip_address,
      })
    }

    // Merge legal acceptance into user data
    const enrichedData = (data || []).map((user: { id: string }) => ({
      ...user,
      legal_acceptance: acceptanceMap.get(user.id) || null,
    }))

    return NextResponse.json({
      data: enrichedData,
      total: count,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false,
      },
    })
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
