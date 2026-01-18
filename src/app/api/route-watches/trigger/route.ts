import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

interface RoutePoint {
  type: "start" | "stop" | "end"
  address: string
  lat: number
  lng: number
  order: number
}

interface RouteWatch {
  id: string
  user_id: string
  type: "location" | "route"
  name: string
  location_lat: number | null
  location_lng: number | null
  location_address: string | null
  radius_km: number
  start_lat: number | null
  start_lng: number | null
  start_address: string | null
  end_lat: number | null
  end_lng: number | null
  end_address: string | null
  ride_type: "offer" | "request" | "both"
  is_active: boolean
  push_enabled: boolean
  email_enabled: boolean
}

// Haversine formula to calculate distance between two points in km
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Check if a point is within radius of another point
function isWithinRadius(
  watchLat: number,
  watchLng: number,
  pointLat: number,
  pointLng: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(watchLat, watchLng, pointLat, pointLng)
  return distance <= radiusKm
}

// Check if a route matches a location watch (any point on route within radius)
function matchesLocationWatch(
  watch: RouteWatch,
  route: RoutePoint[]
): { matches: boolean; matchedPoint?: RoutePoint } {
  if (watch.type !== "location" || !watch.location_lat || !watch.location_lng) {
    return { matches: false }
  }

  for (const point of route) {
    if (point.lat && point.lng) {
      if (isWithinRadius(watch.location_lat, watch.location_lng, point.lat, point.lng, watch.radius_km)) {
        return { matches: true, matchedPoint: point }
      }
    }
  }

  return { matches: false }
}

// Check if a route matches a route watch (start near start, end near end)
function matchesRouteWatch(
  watch: RouteWatch,
  route: RoutePoint[],
  thresholdKm: number = 20
): { matches: boolean; startMatch?: boolean; endMatch?: boolean } {
  if (watch.type !== "route" || !watch.start_lat || !watch.end_lat) {
    return { matches: false }
  }

  const startPoint = route.find((p) => p.type === "start")
  const endPoint = route.find((p) => p.type === "end")

  if (!startPoint || !endPoint) {
    return { matches: false }
  }

  const startMatch =
    startPoint.lat &&
    startPoint.lng &&
    watch.start_lat &&
    watch.start_lng &&
    isWithinRadius(watch.start_lat, watch.start_lng, startPoint.lat, startPoint.lng, thresholdKm)

  const endMatch =
    endPoint.lat &&
    endPoint.lng &&
    watch.end_lat &&
    watch.end_lng &&
    isWithinRadius(watch.end_lat, watch.end_lng, endPoint.lat, endPoint.lng, thresholdKm)

  return {
    matches: Boolean(startMatch && endMatch),
    startMatch: Boolean(startMatch),
    endMatch: Boolean(endMatch),
  }
}

// POST /api/route-watches/trigger - Trigger watches for a new ride
// This should be called after a new ride is created
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
    const { rideId, route, rideType } = body as {
      rideId: string
      route: RoutePoint[]
      rideType: "offer" | "request"
    }

    if (!rideId || !route || !rideType) {
      return NextResponse.json(
        { error: "rideId, route, and rideType are required" },
        { status: 400 }
      )
    }

    // Get admin client for cross-user operations
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all active watches from OTHER users that match this ride type
    const { data: watches, error: watchError } = await adminClient
      .from("route_watches")
      .select("*")
      .eq("is_active", true)
      .neq("user_id", user.id) // Don't notify the ride creator
      .or(`ride_type.eq.both,ride_type.eq.${rideType}`)

    if (watchError) {
      console.error("Error fetching watches:", watchError)
      return NextResponse.json({ error: "Failed to fetch watches" }, { status: 500 })
    }

    const matchedWatches: Array<{
      watch: RouteWatch
      matchType: "location" | "route"
      details: string
    }> = []

    // Check each watch for matches
    for (const watch of (watches || []) as RouteWatch[]) {
      if (watch.type === "location") {
        const locationMatch = matchesLocationWatch(watch, route)
        if (locationMatch.matches) {
          matchedWatches.push({
            watch,
            matchType: "location",
            details: locationMatch.matchedPoint
              ? `Route passiert ${locationMatch.matchedPoint.address}`
              : `Route im Umkreis von ${watch.location_address}`,
          })
        }
      } else if (watch.type === "route") {
        const routeMatch = matchesRouteWatch(watch, route)
        if (routeMatch.matches) {
          matchedWatches.push({
            watch,
            matchType: "route",
            details: `Route von ${watch.start_address} nach ${watch.end_address}`,
          })
        }
      }
    }

    // Create notifications for matched watches
    const notificationsToCreate = matchedWatches.map(({ watch, details }) => ({
      user_id: watch.user_id,
      type: "ride_match" as const,
      title: rideType === "offer" ? "Neue passende Fahrt!" : "Neue Mitfahranfrage!",
      message: details,
      data: {
        ride_id: rideId,
        watch_id: watch.id,
        watch_name: watch.name,
      },
    }))

    if (notificationsToCreate.length > 0) {
      const { error: notifError } = await adminClient
        .from("notifications")
        .insert(notificationsToCreate)

      if (notifError) {
        console.error("Error creating notifications:", notifError)
        // Don't fail the whole operation, just log the error
      }

      // Update watch stats
      const watchIds = matchedWatches.map(({ watch }) => watch.id)
      for (const watchId of watchIds) {
        try {
          await adminClient.rpc("increment_watch_trigger", { watch_id: watchId })
        } catch {
          // Ignore RPC errors, stats are not critical
        }
      }
    }

    return NextResponse.json({
      success: true,
      matchedWatchesCount: matchedWatches.length,
      notificationsSent: notificationsToCreate.length,
    })
  } catch (error) {
    console.error("Error in POST /api/route-watches/trigger:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
