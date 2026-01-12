import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/promo-codes/[id] - Get a single promo code (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    const { data, error } = await supabase
      .from("promo_codes")
      .select(`
        *,
        creator:profiles!promo_codes_created_by_fkey (
          id, username, first_name, last_name
        ),
        redemptions:code_redemptions (
          id,
          redeemed_at,
          user:profiles (
            id, username, first_name, last_name, email
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching promo code:", error)
    return NextResponse.json(
      { error: "Failed to fetch promo code" },
      { status: 500 }
    )
  }
}

// PATCH /api/promo-codes/[id] - Update a promo code (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    const updateData: Record<string, unknown> = {}

    // Only allow certain fields to be updated
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.max_uses !== undefined) updateData.max_uses = body.max_uses
    if (body.valid_until !== undefined) updateData.valid_until = body.valid_until
    if (body.value !== undefined) updateData.value = body.value
    if (body.duration_months !== undefined) updateData.duration_months = body.duration_months

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("promo_codes")
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error updating promo code:", error)
    return NextResponse.json(
      { error: "Failed to update promo code" },
      { status: 500 }
    )
  }
}

// DELETE /api/promo-codes/[id] - Delete a promo code (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting promo code:", error)
    return NextResponse.json(
      { error: "Failed to delete promo code" },
      { status: 500 }
    )
  }
}
