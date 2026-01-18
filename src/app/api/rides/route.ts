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

// Helper to generate dates for recurring rides
function generateRecurringDates(
  startDate: Date,
  recurringDays: number[],
  recurringUntil: Date
): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)

  // Start from the beginning of the week of startDate
  current.setDate(current.getDate() - current.getDay())

  while (current <= recurringUntil) {
    for (const dayOfWeek of recurringDays) {
      const date = new Date(current)
      date.setDate(current.getDate() + dayOfWeek)

      // Only include dates that are >= startDate and <= recurringUntil
      if (date >= startDate && date <= recurringUntil) {
        dates.push(new Date(date))
      }
    }
    // Move to next week
    current.setDate(current.getDate() + 7)
  }

  return dates
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
    const {
      type,
      route,
      departure_date,
      departure_time,
      seats_available,
      comment,
      is_recurring,
      recurring_days,
      recurring_until,
      // Route geometry from OSRM routing (optional)
      route_geometry,
      route_distance,
      route_duration,
    } = body

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

    // Validate recurring ride parameters
    if (is_recurring && (!recurring_days || recurring_days.length === 0)) {
      return NextResponse.json(
        { error: "Recurring days are required for recurring rides" },
        { status: 400 }
      )
    }

    const routeData = route.map((point: RoutePoint, index: number) => ({
      ...point,
      order: index,
    }))

    // For recurring rides, create multiple ride entries
    // Fixed: Proper error handling with rollback if child rides fail
    if (is_recurring && recurring_days && recurring_until) {
      const startDate = new Date(departure_date)
      const endDate = new Date(recurring_until)
      const dates = generateRecurringDates(startDate, recurring_days, endDate)

      if (dates.length === 0) {
        return NextResponse.json(
          { error: "No valid dates found for the recurring schedule" },
          { status: 400 }
        )
      }

      // Limit recurring rides to prevent abuse (max 52 weeks = 1 year)
      const MAX_RECURRING_RIDES = 52
      if (dates.length > MAX_RECURRING_RIDES) {
        return NextResponse.json(
          { error: `Maximum ${MAX_RECURRING_RIDES} recurring rides allowed` },
          { status: 400 }
        )
      }

      // Create the parent ride first
      const parentDepartureDate = dates[0]
      const parentExpiresAt = new Date(parentDepartureDate)
      parentExpiresAt.setDate(parentExpiresAt.getDate() + 7)

      const parentRideData: RideInsert = {
        user_id: user.id,
        type,
        route: routeData,
        departure_date: parentDepartureDate.toISOString().split("T")[0],
        departure_time: departure_time || null,
        seats_available: type === "offer" ? (seats_available || 1) : 1,
        comment: comment || null,
        status: "active",
        expires_at: parentExpiresAt.toISOString(),
        is_recurring: true,
        recurring_days,
        recurring_until,
      }

      // Add route geometry fields only if provided (column might not exist)
      if (route_geometry) {
        (parentRideData as Record<string, unknown>).route_geometry = route_geometry
      }
      if (route_distance) {
        (parentRideData as Record<string, unknown>).route_distance = route_distance
      }
      if (route_duration) {
        (parentRideData as Record<string, unknown>).route_duration = route_duration
      }

      const { data: parentRide, error: parentError } = await supabase
        .from("rides")
        .insert(parentRideData as never)
        .select(`
          *,
          profiles:user_id (
            id, username, first_name, last_name, avatar_url, city, bio
          )
        `)
        .single()

      if (parentError) throw parentError

      const parentRideId = (parentRide as { id: string }).id
      let childRidesCreated = 0

      // Create child rides for remaining dates
      if (dates.length > 1) {
        const childRides = dates.slice(1).map((date) => {
          const expiresAt = new Date(date)
          expiresAt.setDate(expiresAt.getDate() + 7)

          const childRide: Record<string, unknown> = {
            user_id: user.id,
            type,
            route: routeData,
            departure_date: date.toISOString().split("T")[0],
            departure_time: departure_time || null,
            seats_available: type === "offer" ? (seats_available || 1) : 1,
            comment: comment || null,
            status: "active",
            expires_at: expiresAt.toISOString(),
            is_recurring: true,
            recurring_days,
            recurring_until,
            parent_ride_id: parentRideId,
          }

          // Add route geometry fields only if provided
          if (route_geometry) childRide.route_geometry = route_geometry
          if (route_distance) childRide.route_distance = route_distance
          if (route_duration) childRide.route_duration = route_duration

          return childRide
        })

        const { data: createdChildRides, error: childError } = await supabase
          .from("rides")
          .insert(childRides as never)
          .select("id")

        if (childError) {
          console.error("Error creating child rides:", childError)
          // Rollback: Delete parent ride if child rides failed
          await supabase.from("rides").delete().eq("id", parentRideId)
          return NextResponse.json(
            { error: "Failed to create recurring rides. Please try again." },
            { status: 500 }
          )
        }

        childRidesCreated = createdChildRides?.length || 0
      }

      // Trigger route watches for this new recurring ride (async, don't wait)
      triggerRouteWatches(parentRideId, routeData, type).catch((err) =>
        console.error("Error triggering route watches:", err)
      )

      return NextResponse.json({
        data: parentRide,
        recurring_count: 1 + childRidesCreated,
      }, { status: 201 })
    }

    // Non-recurring ride
    const departureDate = new Date(departure_date)
    const sevenDaysAfterDeparture = new Date(departureDate)
    sevenDaysAfterDeparture.setDate(sevenDaysAfterDeparture.getDate() + 7)

    const fourteenDaysFromNow = new Date()
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14)

    const expiresAt = departureDate < new Date()
      ? sevenDaysAfterDeparture
      : new Date(Math.max(sevenDaysAfterDeparture.getTime(), fourteenDaysFromNow.getTime()))

    // Build ride data with only base fields that are guaranteed to exist
    const rideData: Record<string, unknown> = {
      user_id: user.id,
      type,
      route: routeData,
      departure_date,
      departure_time: departure_time || null,
      seats_available: type === "offer" ? (seats_available || 1) : 1,
      comment: comment || null,
      status: "active",
      expires_at: expiresAt.toISOString(),
      // Include recurring fields - these columns should exist after migration 014
      is_recurring: is_recurring || false,
    }

    // Add route geometry fields only if provided and valid
    if (route_geometry && Array.isArray(route_geometry) && route_geometry.length > 0) {
      rideData.route_geometry = route_geometry
      if (route_distance) rideData.route_distance = route_distance
      if (route_duration) rideData.route_duration = route_duration
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

    // Trigger route watches for this new ride (async, don't wait)
    triggerRouteWatches(
      (data as { id: string }).id,
      routeData,
      type
    ).catch((err) => console.error("Error triggering route watches:", err))

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("Error creating ride:", error)
    // Return detailed error in development for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorDetails = error && typeof error === "object" && "code" in error
      ? (error as { code?: string; details?: string; hint?: string })
      : null
    return NextResponse.json(
      {
        error: "Failed to create ride",
        message: errorMessage,
        code: errorDetails?.code,
        details: errorDetails?.details,
        hint: errorDetails?.hint,
      },
      { status: 500 }
    )
  }
}

// Helper function to trigger route watches asynchronously
async function triggerRouteWatches(
  rideId: string,
  route: RoutePoint[],
  rideType: "offer" | "request"
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    await fetch(`${baseUrl}/api/route-watches/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rideId, route, rideType }),
    })
  } catch (error) {
    console.error("Failed to trigger route watches:", error)
  }
}
