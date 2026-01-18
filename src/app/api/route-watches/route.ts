import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// Validation schemas
const locationWatchSchema = z.object({
  type: z.literal("location"),
  name: z.string().min(1).max(100),
  location_lat: z.number().min(-90).max(90),
  location_lng: z.number().min(-180).max(180),
  location_address: z.string().min(1),
  radius_km: z.number().min(1).max(100).default(25),
  ride_type: z.enum(["offer", "request", "both"]).default("both"),
  push_enabled: z.boolean().default(false),
  email_enabled: z.boolean().default(false),
})

const routeWatchSchema = z.object({
  type: z.literal("route"),
  name: z.string().min(1).max(100),
  start_lat: z.number().min(-90).max(90),
  start_lng: z.number().min(-180).max(180),
  start_address: z.string().min(1),
  end_lat: z.number().min(-90).max(90),
  end_lng: z.number().min(-180).max(180),
  end_address: z.string().min(1),
  ride_type: z.enum(["offer", "request", "both"]).default("both"),
  push_enabled: z.boolean().default(false),
  email_enabled: z.boolean().default(false),
})

const createWatchSchema = z.discriminatedUnion("type", [locationWatchSchema, routeWatchSchema])

const MAX_WATCHES_PER_USER = 10

// GET /api/route-watches - Get all watches for current user
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: watches, error } = await supabase
      .from("route_watches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching route watches:", error)
      return NextResponse.json({ error: "Failed to fetch watches" }, { status: 500 })
    }

    return NextResponse.json({ data: watches })
  } catch (error) {
    console.error("Error in GET /api/route-watches:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/route-watches - Create a new watch
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check watch limit
    const { count } = await supabase
      .from("route_watches")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (count && count >= MAX_WATCHES_PER_USER) {
      return NextResponse.json(
        { error: `Maximum ${MAX_WATCHES_PER_USER} watches allowed` },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate input
    const parseResult = createWatchSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const watchData = {
      user_id: user.id,
      ...parseResult.data,
      is_active: true,
    }

    const { data: watch, error } = await supabase
      .from("route_watches")
      .insert(watchData as never)
      .select()
      .single()

    if (error) {
      console.error("Error creating route watch:", error)
      return NextResponse.json({ error: "Failed to create watch" }, { status: 500 })
    }

    return NextResponse.json({ data: watch }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/route-watches:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
