import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { RideInsert, RoutePoint } from "@/types"

// GET /api/rides - Get rides with optional filters
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get("type") // 'offer' or 'request'
  const status = searchParams.get("status") || "active"
  const userId = searchParams.get("user_id")
  const fromDate = searchParams.get("from_date")
  const toDate = searchParams.get("to_date")
  const startLocation = searchParams.get("start_location")
  const endLocation = searchParams.get("end_location")
  const limit = parseInt(searchParams.get("limit") || "50")
  const offset = parseInt(searchParams.get("offset") || "0")

  try {
    let query = supabase
      .from("rides")
      .select(`
        *,
        profiles:user_id (
          id, username, first_name, last_name, avatar_url, city, bio
        )
      `, { count: "exact" })

    // Filter by status
    if (status !== "all") {
      query = query.eq("status", status)
    }

    // Filter by type
    if (type && (type === "offer" || type === "request")) {
      query = query.eq("type", type)
    }

    // Filter by user
    if (userId) {
      query = query.eq("user_id", userId)
    }

    // Filter by date range
    if (fromDate) {
      query = query.gte("departure_date", fromDate)
    }
    if (toDate) {
      query = query.lte("departure_date", toDate)
    }

    // Text search in route (PostgreSQL JSON search)
    if (startLocation) {
      query = query.ilike("route->0->>address", `%${startLocation}%`)
    }
    if (endLocation) {
      // Search in last element or any element with type 'end'
      query = query.or(`route.cs.[{"type":"end","address":"${endLocation}"}]`)
    }

    // Pagination and ordering
    const { data, error, count } = await query
      .order("departure_date", { ascending: true })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false,
      },
    })
  } catch (error) {
    console.error("Error fetching rides:", error)
    return NextResponse.json(
      { error: "Failed to fetch rides" },
      { status: 500 }
    )
  }
}

// POST /api/rides - Create a new ride
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
    const { type, route, departure_date, departure_time, seats_available, comment } = body

    // Validation
    if (!type || !["offer", "request"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'offer' or 'request'" },
        { status: 400 }
      )
    }

    if (!route || !Array.isArray(route) || route.length < 2) {
      return NextResponse.json(
        { error: "Route must have at least start and end points" },
        { status: 400 }
      )
    }

    // Validate route points
    const hasStart = route.some((p: RoutePoint) => p.type === "start")
    const hasEnd = route.some((p: RoutePoint) => p.type === "end")
    if (!hasStart || !hasEnd) {
      return NextResponse.json(
        { error: "Route must have start and end points" },
        { status: 400 }
      )
    }

    if (!departure_date) {
      return NextResponse.json(
        { error: "Departure date is required" },
        { status: 400 }
      )
    }

    // Calculate expiration (7 days after departure or 14 days from now, whichever is later)
    const departureDate = new Date(departure_date)
    const sevenDaysAfterDeparture = new Date(departureDate)
    sevenDaysAfterDeparture.setDate(sevenDaysAfterDeparture.getDate() + 7)

    const fourteenDaysFromNow = new Date()
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14)

    const expiresAt = departureDate < new Date()
      ? sevenDaysAfterDeparture
      : new Date(Math.max(sevenDaysAfterDeparture.getTime(), fourteenDaysFromNow.getTime()))

    const rideData: RideInsert = {
      user_id: user.id,
      type,
      route: route.map((point: RoutePoint, index: number) => ({
        ...point,
        order: index,
      })),
      departure_date,
      departure_time: departure_time || null,
      seats_available: type === "offer" ? (seats_available || 1) : 1,
      comment: comment || null,
      status: "active",
      expires_at: expiresAt.toISOString(),
    }

    const { data, error } = await supabase
      .from("rides")
      .insert(rideData as never)
      .select(`
        *,
        profiles:user_id (
          id, username, first_name, last_name, avatar_url, city, bio
        )
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("Error creating ride:", error)
    return NextResponse.json(
      { error: "Failed to create ride" },
      { status: 500 }
    )
  }
}
