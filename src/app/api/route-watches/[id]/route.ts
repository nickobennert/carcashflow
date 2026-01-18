import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// Validation schema for updates
const updateWatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
  ride_type: z.enum(["offer", "request", "both"]).optional(),
  push_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  radius_km: z.number().min(1).max(100).optional(),
})

// GET /api/route-watches/[id] - Get a specific watch
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

    const { data: watch, error } = await supabase
      .from("route_watches")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error || !watch) {
      return NextResponse.json({ error: "Watch not found" }, { status: 404 })
    }

    return NextResponse.json({ data: watch })
  } catch (error) {
    console.error("Error in GET /api/route-watches/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/route-watches/[id] - Update a watch
export async function PATCH(
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

    const body = await request.json()

    // Validate input
    const parseResult = updateWatchSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    // Only update provided fields
    const updateData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(parseResult.data)) {
      if (value !== undefined) {
        updateData[key] = value
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data: watch, error } = await supabase
      .from("route_watches")
      .update(updateData as never)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating route watch:", error)
      return NextResponse.json({ error: "Failed to update watch" }, { status: 500 })
    }

    if (!watch) {
      return NextResponse.json({ error: "Watch not found" }, { status: 404 })
    }

    return NextResponse.json({ data: watch })
  } catch (error) {
    console.error("Error in PATCH /api/route-watches/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/route-watches/[id] - Delete a watch
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

    const { error } = await supabase
      .from("route_watches")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting route watch:", error)
      return NextResponse.json({ error: "Failed to delete watch" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/route-watches/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
