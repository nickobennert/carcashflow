import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/promo-codes - List all promo codes (admin only)
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const searchParams = request.nextUrl.searchParams
  const active = searchParams.get("active")

  try {
    let query = supabase
      .from("promo_codes")
      .select(`
        *,
        creator:profiles!promo_codes_created_by_fkey (
          id, username, first_name, last_name
        )
      `)
      .order("created_at", { ascending: false })

    if (active === "true") {
      query = query.eq("is_active", true)
    } else if (active === "false") {
      query = query.eq("is_active", false)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching promo codes:", error)
    return NextResponse.json(
      { error: "Failed to fetch promo codes" },
      { status: 500 }
    )
  }
}

// POST /api/promo-codes - Create a new promo code (admin only)
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  try {
    const body = await request.json()
    const {
      code,
      type,
      value,
      duration_months,
      max_uses,
      valid_from,
      valid_until,
    } = body

    if (!code || !type) {
      return NextResponse.json(
        { error: "Code and type are required" },
        { status: 400 }
      )
    }

    const validTypes = ["percent_discount", "fixed_discount", "free_months", "lifetime_free"]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid promo code type" },
        { status: 400 }
      )
    }

    // Check if code already exists
    const { data: existingCode } = await supabase
      .from("promo_codes")
      .select("id")
      .eq("code", code.toUpperCase())
      .single()

    if (existingCode) {
      return NextResponse.json(
        { error: "Code already exists" },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from("promo_codes")
      .insert({
        code: code.toUpperCase(),
        type,
        value: value || null,
        duration_months: duration_months || null,
        max_uses: max_uses || null,
        valid_from: valid_from || new Date().toISOString(),
        valid_until: valid_until || null,
        created_by: user.id,
      } as never)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("Error creating promo code:", error)
    return NextResponse.json(
      { error: "Failed to create promo code" },
      { status: 500 }
    )
  }
}
