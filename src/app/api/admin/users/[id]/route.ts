import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { logAuditEvent } from "@/lib/audit"

interface RouteParams {
  params: Promise<{ id: string }>
}

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

// GET /api/admin/users/[id] - Get a specific user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      throw error
    }

    // Also get user's ride count and message count
    const [{ count: rideCount }, { count: messageCount }] = await Promise.all([
      supabaseAdmin.from("rides").select("*", { count: "exact", head: true }).eq("user_id", id),
      supabaseAdmin.from("messages").select("*", { count: "exact", head: true }).eq("sender_id", id),
    ])

    return NextResponse.json({
      data: {
        ...(data as Record<string, unknown>),
        stats: {
          rides: rideCount || 0,
          messages: messageCount || 0,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/users/[id] - Update user profile (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { is_banned } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Handle ban status
    if (is_banned !== undefined) {
      updateData.is_banned = is_banned
    }

    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in PUT /api/admin/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/users/[id]/ban - Ban/unban user
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Prevent admin from banning themselves
    if (id === user.id) {
      return NextResponse.json({ error: "Cannot ban yourself" }, { status: 400 })
    }

    const body = await request.json()
    const { action } = body // 'ban' or 'unban'

    if (!action || !["ban", "unban"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const isBanned = action === "ban"
    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        is_banned: isBanned,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user status:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    // Create notification for the user
    await supabaseAdmin.from("notifications").insert({
      user_id: id,
      type: "system",
      title: action === "ban" ? "Account gesperrt" : "Account entsperrt",
      message: action === "ban"
        ? "Dein Account wurde vorübergehend gesperrt. Bitte kontaktiere den Support."
        : "Dein Account wurde wieder entsperrt.",
      data: {},
    } as never)

    // Audit log
    logAuditEvent({
      admin_id: user.id,
      action: isBanned ? "user_banned" : "user_unbanned",
      target_type: "user",
      target_id: id,
    })

    return NextResponse.json({ data, action })
  } catch (error) {
    console.error("Error in POST /api/admin/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
