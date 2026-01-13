import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { RideWithUser, RoutePoint } from "@/types"

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Check if a point is "on the way" of a route (within threshold km of any segment)
function isPointOnRoute(
  point: { lat: number; lng: number },
  route: { lat?: number; lng?: number }[],
  thresholdKm: number = 20
): boolean {
  const validRoute = route.filter((p) => p.lat && p.lng) as { lat: number; lng: number }[]
  if (validRoute.length < 2) return false

  for (let i = 0; i < validRoute.length - 1; i++) {
    const d1 = calculateDistance(point.lat, point.lng, validRoute[i].lat, validRoute[i].lng)
    const d2 = calculateDistance(point.lat, point.lng, validRoute[i + 1].lat, validRoute[i + 1].lng)

    // Point is close to any segment endpoint
    if (Math.min(d1, d2) <= thresholdKm) {
      return true
    }
  }
  return false
}

// Calculate similarity score between two routes (0-100)
function calculateRouteSimilarity(
  route1: RoutePoint[],
  route2: RoutePoint[]
): number {
  const start1 = route1.find((p) => p.type === "start")
  const end1 = route1.find((p) => p.type === "end")
  const start2 = route2.find((p) => p.type === "start")
  const end2 = route2.find((p) => p.type === "end")

  if (!start1?.lat || !end1?.lat || !start2?.lat || !end2?.lat) return 0

  // Calculate distances
  const startDistance = calculateDistance(start1.lat, start1.lng!, start2.lat, start2.lng!)
  const endDistance = calculateDistance(end1.lat, end1.lng!, end2.lat, end2.lng!)

  // Score based on proximity (closer = higher score)
  // 0km = 100 points, 50km = 50 points, 100km+ = 0 points
  const startScore = Math.max(0, 100 - startDistance * 2)
  const endScore = Math.max(0, 100 - endDistance * 2)

  return Math.round((startScore + endScore) / 2)
}

// POST /api/rides/match - Find matching rides for a given route
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
    const { route, type, departure_date, threshold_km = 25 } = body

    if (!route || !Array.isArray(route) || route.length < 2) {
      return NextResponse.json(
        { error: "Route must have at least start and end points" },
        { status: 400 }
      )
    }

    // Find the opposite type (if user offers, find requests; if user requests, find offers)
    const searchType = type === "offer" ? "request" : "offer"

    // Get active rides of the opposite type
    let query = supabase
      .from("rides")
      .select(`
        *,
        profiles:user_id (
          id, username, first_name, last_name, avatar_url, city, bio
        )
      `)
      .eq("status", "active")
      .eq("type", searchType)
      .neq("user_id", user.id) // Exclude own rides

    // Filter by date if provided (+-3 days)
    if (departure_date) {
      const date = new Date(departure_date)
      const fromDate = new Date(date)
      fromDate.setDate(fromDate.getDate() - 3)
      const toDate = new Date(date)
      toDate.setDate(toDate.getDate() + 3)

      query = query
        .gte("departure_date", fromDate.toISOString().split("T")[0])
        .lte("departure_date", toDate.toISOString().split("T")[0])
    }

    const { data: rides, error } = await query
      .order("departure_date", { ascending: true })
      .limit(100)

    if (error) throw error

    // Calculate similarity scores and filter
    const matchedRides = (rides as RideWithUser[])
      .map((ride) => {
        const similarity = calculateRouteSimilarity(route, ride.route)

        // Check if any route point is "on the way" of the other route
        const start = route.find((p: RoutePoint) => p.type === "start")
        const end = route.find((p: RoutePoint) => p.type === "end")
        const rideStart = ride.route.find((p) => p.type === "start")
        const rideEnd = ride.route.find((p) => p.type === "end")

        let onTheWay = false
        if (start?.lat && end?.lat) {
          // Check if ride's start/end is on user's route
          if (rideStart?.lat) {
            onTheWay = onTheWay || isPointOnRoute(
              { lat: rideStart.lat, lng: rideStart.lng! },
              route,
              threshold_km
            )
          }
          if (rideEnd?.lat) {
            onTheWay = onTheWay || isPointOnRoute(
              { lat: rideEnd.lat, lng: rideEnd.lng! },
              route,
              threshold_km
            )
          }
        }

        return {
          ...ride,
          similarity,
          onTheWay,
        }
      })
      .filter((ride) => ride.similarity >= 20 || ride.onTheWay)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20)

    return NextResponse.json({
      data: matchedRides,
      count: matchedRides.length,
    })
  } catch (error) {
    console.error("Error matching rides:", error)
    return NextResponse.json(
      { error: "Failed to match rides" },
      { status: 500 }
    )
  }
}

// GET /api/rides/match - Find rides passing through a specific location
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const lat = parseFloat(searchParams.get("lat") || "0")
  const lng = parseFloat(searchParams.get("lng") || "0")
  const radius = parseFloat(searchParams.get("radius") || "25") // km
  const type = searchParams.get("type") // 'offer' or 'request'
  const fromDate = searchParams.get("from_date")

  if (lat === 0 || lng === 0) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    )
  }

  try {
    let query = supabase
      .from("rides")
      .select(`
        *,
        profiles:user_id (
          id, username, first_name, last_name, avatar_url, city, bio
        )
      `)
      .eq("status", "active")
      .neq("user_id", user.id)

    if (type) {
      query = query.eq("type", type)
    }

    if (fromDate) {
      query = query.gte("departure_date", fromDate)
    } else {
      // Default: from today
      query = query.gte("departure_date", new Date().toISOString().split("T")[0])
    }

    const { data: rides, error } = await query
      .order("departure_date", { ascending: true })
      .limit(200)

    if (error) throw error

    // Filter rides that pass through the given location
    const nearbyRides = (rides as RideWithUser[])
      .map((ride) => {
        const userPoint = { lat, lng }
        const onRoute = isPointOnRoute(userPoint, ride.route, radius)

        // Calculate distance to nearest point on route
        let minDistance = Infinity
        for (const point of ride.route) {
          if (point.lat && point.lng) {
            const d = calculateDistance(lat, lng, point.lat, point.lng)
            if (d < minDistance) minDistance = d
          }
        }

        return {
          ...ride,
          onRoute,
          distance: Math.round(minDistance),
        }
      })
      .filter((ride) => ride.onRoute || ride.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 30)

    return NextResponse.json({
      data: nearbyRides,
      count: nearbyRides.length,
    })
  } catch (error) {
    console.error("Error finding nearby rides:", error)
    return NextResponse.json(
      { error: "Failed to find nearby rides" },
      { status: 500 }
    )
  }
}
