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

// Calculate perpendicular distance from a point to a line segment
// This is the key fix for detecting "Düsseldorf is on the way from Rheine to Köln"
function pointToSegmentDistance(
  point: { lat: number; lng: number },
  segStart: { lat: number; lng: number },
  segEnd: { lat: number; lng: number }
): number {
  const { lat: px, lng: py } = point
  const { lat: ax, lng: ay } = segStart
  const { lat: bx, lng: by } = segEnd

  // Vector from A to B
  const abx = bx - ax
  const aby = by - ay

  // Vector from A to P
  const apx = px - ax
  const apy = py - ay

  // Project AP onto AB to find the closest point on the segment
  const abSquared = abx * abx + aby * aby

  // Handle degenerate case (A == B)
  if (abSquared === 0) {
    return calculateDistance(px, py, ax, ay)
  }

  // Parameter t for the projection (clamped to [0, 1] for segment)
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abSquared))

  // Find the closest point on the segment
  const closestLat = ax + t * abx
  const closestLng = ay + t * aby

  // Return distance from point to closest point on segment
  return calculateDistance(px, py, closestLat, closestLng)
}

// Match quality tiers based on distance from route
type MatchTier = "direct" | "small_detour" | "detour" | "none"

function getMatchTier(distanceKm: number): MatchTier {
  if (distanceKm <= 5) return "direct"       // Directly on the route (e.g. next highway exit)
  if (distanceKm <= 15) return "small_detour" // Small detour (~1-2 exits off highway)
  if (distanceKm <= 30) return "detour"       // Noticeable detour but still reasonable
  return "none"
}

function getMatchTierLabel(tier: MatchTier, distanceKm: number): string {
  const rounded = Math.round(distanceKm)
  switch (tier) {
    case "direct": return `direkt auf der Route`
    case "small_detour": return `${rounded} km Umweg`
    case "detour": return `${rounded} km Umweg`
    case "none": return ""
  }
}

const TIER_RANK: Record<MatchTier, number> = { direct: 3, small_detour: 2, detour: 1, none: 0 }

function betterTier(a: MatchTier, b: MatchTier): MatchTier {
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b
}

// Check if a point is "on the way" of a route (within threshold km of any segment)
// Returns match tier and distance for graduated matching
function isPointOnRoute(
  point: { lat: number; lng: number },
  route: { lat?: number; lng?: number }[],
  thresholdKm: number = 30
): { onRoute: boolean; minDistance: number; tier: MatchTier } {
  const validRoute = route.filter((p) => p.lat && p.lng) as { lat: number; lng: number }[]
  if (validRoute.length < 2) return { onRoute: false, minDistance: Infinity, tier: "none" }

  let minDistance = Infinity

  for (let i = 0; i < validRoute.length - 1; i++) {
    // Calculate perpendicular distance to this segment
    const segmentDistance = pointToSegmentDistance(
      point,
      validRoute[i],
      validRoute[i + 1]
    )

    if (segmentDistance < minDistance) {
      minDistance = segmentDistance
    }

    // Early exit if we found a direct match
    if (segmentDistance <= 5) {
      return { onRoute: true, minDistance: segmentDistance, tier: "direct" }
    }
  }

  const tier = getMatchTier(minDistance)
  return { onRoute: tier !== "none", minDistance, tier }
}

// Check if point is within a "corridor" between two points
// Used to detect if intermediate stops are genuinely on the way
function isPointInCorridor(
  point: { lat: number; lng: number },
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  corridorWidthKm: number = 30
): boolean {
  // Calculate the direct distance from start to end
  const directDistance = calculateDistance(start.lat, start.lng, end.lat, end.lng)

  // Calculate distances via the point
  const distToStart = calculateDistance(point.lat, point.lng, start.lat, start.lng)
  const distToEnd = calculateDistance(point.lat, point.lng, end.lat, end.lng)
  const viaDistance = distToStart + distToEnd

  // The point is "on the way" if going via it doesn't add much detour
  // Allow up to 20% extra distance or corridorWidthKm, whichever is greater
  const maxDetour = Math.max(directDistance * 0.2, corridorWidthKm)

  return (viaDistance - directDistance) <= maxDetour
}

// Find the closest segment index on a route for a given point
// Returns the segment index and the projected t-parameter (0-1) along the route
function findClosestSegmentIndex(
  point: { lat: number; lng: number },
  route: { lat: number; lng: number }[]
): { segmentIndex: number; t: number; distance: number } {
  let bestIndex = 0
  let bestT = 0
  let bestDistance = Infinity

  for (let i = 0; i < route.length - 1; i++) {
    const ax = route[i].lat
    const ay = route[i].lng
    const bx = route[i + 1].lat
    const by = route[i + 1].lng

    const abx = bx - ax
    const aby = by - ay
    const apx = point.lat - ax
    const apy = point.lng - ay
    const abSquared = abx * abx + aby * aby

    let t = 0
    if (abSquared > 0) {
      t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abSquared))
    }

    const closestLat = ax + t * abx
    const closestLng = ay + t * aby
    const distance = calculateDistance(point.lat, point.lng, closestLat, closestLng)

    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = i
      bestT = t
    }
  }

  return { segmentIndex: bestIndex, t: bestT, distance: bestDistance }
}

// Check if a sub-route (start + end) lies on a given route in the correct order
// This is the "Route-auf-Route" detection for the München→Berlin / Nürnberg→Leipzig scenario
function isSubRouteOnRoute(
  subStart: { lat: number; lng: number },
  subEnd: { lat: number; lng: number },
  mainRoute: { lat?: number; lng?: number }[],
  thresholdKm: number = 25
): { isOnRoute: boolean; detourKm: number; startDistance: number; endDistance: number } {
  const validRoute = mainRoute.filter((p) => p.lat && p.lng) as { lat: number; lng: number }[]
  if (validRoute.length < 2) {
    return { isOnRoute: false, detourKm: Infinity, startDistance: Infinity, endDistance: Infinity }
  }

  // Find where subStart and subEnd project onto the main route
  const startProjection = findClosestSegmentIndex(subStart, validRoute)
  const endProjection = findClosestSegmentIndex(subEnd, validRoute)

  // Both points must be within threshold distance of the route
  if (startProjection.distance > thresholdKm || endProjection.distance > thresholdKm) {
    return {
      isOnRoute: false,
      detourKm: Infinity,
      startDistance: startProjection.distance,
      endDistance: endProjection.distance,
    }
  }

  // Check order: subStart must come BEFORE subEnd along the route
  // Compare using segment index + t-parameter for precise ordering
  const startProgress = startProjection.segmentIndex + startProjection.t
  const endProgress = endProjection.segmentIndex + endProjection.t

  if (startProgress >= endProgress) {
    // Wrong direction - subStart is after subEnd on the main route
    return {
      isOnRoute: false,
      detourKm: Infinity,
      startDistance: startProjection.distance,
      endDistance: endProjection.distance,
    }
  }

  // Calculate detour: how much extra distance would the driver need?
  // The detour is the sum of distances from the route to the pickup/dropoff points
  const detourKm = startProjection.distance + endProjection.distance

  return {
    isOnRoute: true,
    detourKm: Math.round(detourKm * 10) / 10,
    startDistance: Math.round(startProjection.distance * 10) / 10,
    endDistance: Math.round(endProjection.distance * 10) / 10,
  }
}

// Calculate bearing (direction angle) between two points in degrees (0-360)
function calculateBearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLng = toRad(lng2 - lng1)
  const y = Math.sin(dLng) * Math.cos(toRad(lat2))
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng)
  const bearing = Math.atan2(y, x) * (180 / Math.PI)
  return (bearing + 360) % 360
}

// Check if two bearings point roughly in the same direction (within tolerance degrees)
function isSameDirection(bearing1: number, bearing2: number, toleranceDeg: number = 60): boolean {
  let diff = Math.abs(bearing1 - bearing2)
  if (diff > 180) diff = 360 - diff
  return diff <= toleranceDeg
}

// "Same direction" matching for parallel routes (e.g., Köln→Berlin vs Düsseldorf→Potsdam)
// Matches routes that travel in a similar direction with start/end points within maxDistanceKm
function isSameDirectionRoute(
  start1: { lat: number; lng: number },
  end1: { lat: number; lng: number },
  start2: { lat: number; lng: number },
  end2: { lat: number; lng: number },
  maxDistanceKm: number = 60
): { isMatch: boolean; startDistance: number; endDistance: number } {
  const bearing1 = calculateBearing(start1.lat, start1.lng, end1.lat, end1.lng)
  const bearing2 = calculateBearing(start2.lat, start2.lng, end2.lat, end2.lng)

  if (!isSameDirection(bearing1, bearing2)) {
    return { isMatch: false, startDistance: Infinity, endDistance: Infinity }
  }

  // Check that start and end points are within reasonable distance
  const startDist = calculateDistance(start1.lat, start1.lng, start2.lat, start2.lng)
  const endDist = calculateDistance(end1.lat, end1.lng, end2.lat, end2.lng)

  // Both starts and both ends must be within maxDistanceKm
  if (startDist <= maxDistanceKm && endDist <= maxDistanceKm) {
    return { isMatch: true, startDistance: startDist, endDistance: endDist }
  }

  return { isMatch: false, startDistance: startDist, endDistance: endDist }
}

// Build a detailed route for matching: prefer route_geometry (OSRM polyline),
// fall back to the basic route points (start/stops/end)
function getDetailedRoute(
  ride: { route: RoutePoint[]; route_geometry?: [number, number][] | null }
): { lat: number; lng: number }[] {
  // If OSRM geometry is available, use it (hundreds of points along the road)
  if (ride.route_geometry && Array.isArray(ride.route_geometry) && ride.route_geometry.length >= 2) {
    return ride.route_geometry.map(([lat, lng]) => ({ lat, lng }))
  }
  // Fallback: use the basic route points
  return ride.route
    .filter((p) => p.lat && p.lng)
    .sort((a, b) => a.order - b.order)
    .map((p) => ({ lat: p.lat!, lng: p.lng! }))
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
    const { route, type, departure_date, threshold_km = 25, route_geometry } = body

    if (!route || !Array.isArray(route) || route.length < 2) {
      return NextResponse.json(
        { error: "Route must have at least start and end points" },
        { status: 400 }
      )
    }

    // Find matching rides based on type:
    // "all" = search both offer and request, otherwise search for opposite type
    const searchType = type === "all" ? null : (type === "offer" ? "request" : "offer")

    // Get active rides
    let query = supabase
      .from("rides")
      .select(`
        *,
        profiles:user_id (
          id, username, first_name, last_name, avatar_url, city, bio
        )
      `)
      .eq("status", "active")
      .neq("user_id", user.id) // Exclude own rides

    // Only filter by type if not "all"
    if (searchType) {
      query = query.eq("type", searchType)
    }

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

    // Build detailed user route (prefer geometry if available)
    const userDetailedRoute: { lat: number; lng: number }[] =
      route_geometry && Array.isArray(route_geometry) && route_geometry.length >= 2
        ? route_geometry.map(([lat, lng]: [number, number]) => ({ lat, lng }))
        : route
            .filter((p: RoutePoint) => p.lat && p.lng)
            .sort((a: RoutePoint, b: RoutePoint) => a.order - b.order)
            .map((p: RoutePoint) => ({ lat: p.lat!, lng: p.lng! }))

    // Calculate similarity scores and filter
    // Uses route_geometry (OSRM polyline) when available for accurate matching
    const matchedRides = (rides as (RideWithUser & { route_geometry?: [number, number][] | null })[])
      .map((ride) => {
        const similarity = calculateRouteSimilarity(route, ride.route)

        // Get key points from both routes
        const userStart = route.find((p: RoutePoint) => p.type === "start")
        const userEnd = route.find((p: RoutePoint) => p.type === "end")
        const userStops = route.filter((p: RoutePoint) => p.type === "stop")

        const rideStart = ride.route.find((p) => p.type === "start")
        const rideEnd = ride.route.find((p) => p.type === "end")
        const rideStops = ride.route.filter((p) => p.type === "stop")

        // Build detailed route for this ride (prefer OSRM geometry)
        const rideDetailedRoute = getDetailedRoute(ride)

        let onTheWay = false
        const matchDetails: string[] = []
        let minDistance = Infinity

        if (userStart?.lat && userEnd?.lat && rideStart?.lat && rideEnd?.lat) {
          // 1. Check if ride's start/end is on user's route (using detailed geometry)
          const startOnRoute = isPointOnRoute(
            { lat: rideStart.lat, lng: rideStart.lng! },
            userDetailedRoute,
            threshold_km
          )
          if (startOnRoute.onRoute) {
            onTheWay = true
            const tierLabel = getMatchTierLabel(startOnRoute.tier, startOnRoute.minDistance)
            matchDetails.push(`Start ${tierLabel}`)
            if (startOnRoute.minDistance < minDistance) minDistance = startOnRoute.minDistance
          }

          const endOnRoute = isPointOnRoute(
            { lat: rideEnd.lat, lng: rideEnd.lng! },
            userDetailedRoute,
            threshold_km
          )
          if (endOnRoute.onRoute) {
            onTheWay = true
            const tierLabel = getMatchTierLabel(endOnRoute.tier, endOnRoute.minDistance)
            matchDetails.push(`Ziel ${tierLabel}`)
            if (endOnRoute.minDistance < minDistance) minDistance = endOnRoute.minDistance
          }

          // 2. Check if user's points are on ride's route (using ride's detailed geometry)
          const userStartOnRide = isPointOnRoute(
            { lat: userStart.lat, lng: userStart.lng! },
            rideDetailedRoute,
            threshold_km
          )
          if (userStartOnRide.onRoute && !startOnRoute.onRoute) {
            onTheWay = true
            const tierLabel = getMatchTierLabel(userStartOnRide.tier, userStartOnRide.minDistance)
            matchDetails.push(`Dein Start ${tierLabel}`)
            if (userStartOnRide.minDistance < minDistance) minDistance = userStartOnRide.minDistance
          }

          const userEndOnRide = isPointOnRoute(
            { lat: userEnd.lat, lng: userEnd.lng! },
            rideDetailedRoute,
            threshold_km
          )
          if (userEndOnRide.onRoute && !endOnRoute.onRoute) {
            onTheWay = true
            const tierLabel = getMatchTierLabel(userEndOnRide.tier, userEndOnRide.minDistance)
            matchDetails.push(`Dein Ziel ${tierLabel}`)
            if (userEndOnRide.minDistance < minDistance) minDistance = userEndOnRide.minDistance
          }

          // 3. Check intermediate stops (the "Düsseldorf" scenario)
          // Check if any of ride's stops are in the corridor between user's start/end
          for (const stop of rideStops) {
            if (stop.lat && stop.lng) {
              const inCorridor = isPointInCorridor(
                { lat: stop.lat, lng: stop.lng },
                { lat: userStart.lat, lng: userStart.lng! },
                { lat: userEnd.lat, lng: userEnd.lng! },
                threshold_km
              )
              if (inCorridor) {
                onTheWay = true
                matchDetails.push(`Fährt über ${stop.address?.split(",")[0] || "Zwischenstopp"}`)
              }
            }
          }

          // 4. Check if user's stops are on ride's route (using detailed geometry)
          for (const stop of userStops) {
            if (stop.lat && stop.lng) {
              const stopOnRide = isPointOnRoute(
                { lat: stop.lat, lng: stop.lng },
                rideDetailedRoute,
                threshold_km
              )
              if (stopOnRide.onRoute) {
                onTheWay = true
                matchDetails.push(`Dein Stopp ${stop.address?.split(",")[0] || ""} liegt auf der Route`)
              }
            }
          }

          // 5. Route-auf-Route detection (using detailed geometries)
          // Check if ride's entire sub-route (start→end) lies on user's route
          if (!onTheWay) {
            const rideOnUserRoute = isSubRouteOnRoute(
              { lat: rideStart.lat, lng: rideStart.lng! },
              { lat: rideEnd.lat, lng: rideEnd.lng! },
              userDetailedRoute,
              threshold_km
            )
            if (rideOnUserRoute.isOnRoute) {
              onTheWay = true
              matchDetails.push(
                `Route liegt auf deinem Weg (${rideOnUserRoute.detourKm} km Umweg)`
              )
              if (rideOnUserRoute.detourKm < minDistance) minDistance = rideOnUserRoute.detourKm
            }
          }

          // 6. Check reverse: if user's sub-route lies on ride's route (using detailed geometry)
          if (!onTheWay) {
            const userOnRideRoute = isSubRouteOnRoute(
              { lat: userStart.lat, lng: userStart.lng! },
              { lat: userEnd.lat, lng: userEnd.lng! },
              rideDetailedRoute,
              threshold_km
            )
            if (userOnRideRoute.isOnRoute) {
              onTheWay = true
              matchDetails.push(
                `Deine Route liegt auf diesem Weg (${userOnRideRoute.detourKm} km Umweg)`
              )
              if (userOnRideRoute.detourKm < minDistance) minDistance = userOnRideRoute.detourKm
            }
          }

          // 7. Corridor fallback: check if ride's start AND end are both
          // in the corridor between user's start and end (detour-based check)
          // This catches cases where routes don't have geometry and segment distance is too rough
          if (!onTheWay) {
            const rideStartInCorridor = isPointInCorridor(
              { lat: rideStart.lat, lng: rideStart.lng! },
              { lat: userStart.lat, lng: userStart.lng! },
              { lat: userEnd.lat, lng: userEnd.lng! },
              threshold_km
            )
            const rideEndInCorridor = isPointInCorridor(
              { lat: rideEnd.lat, lng: rideEnd.lng! },
              { lat: userStart.lat, lng: userStart.lng! },
              { lat: userEnd.lat, lng: userEnd.lng! },
              threshold_km
            )
            if (rideStartInCorridor && rideEndInCorridor) {
              onTheWay = true
              matchDetails.push(`Fährt in die gleiche Richtung`)
              const detour =
                calculateDistance(userStart.lat, userStart.lng!, rideStart.lat, rideStart.lng!) +
                calculateDistance(userEnd.lat, userEnd.lng!, rideEnd.lat, rideEnd.lng!)
              if (detour < minDistance) minDistance = detour
            }
          }

          // 8. Reverse corridor: check if user's start AND end are in ride's corridor
          if (!onTheWay) {
            const userStartInCorridor = isPointInCorridor(
              { lat: userStart.lat, lng: userStart.lng! },
              { lat: rideStart.lat, lng: rideStart.lng! },
              { lat: rideEnd.lat, lng: rideEnd.lng! },
              threshold_km
            )
            const userEndInCorridor = isPointInCorridor(
              { lat: userEnd.lat, lng: userEnd.lng! },
              { lat: rideStart.lat, lng: rideStart.lng! },
              { lat: rideEnd.lat, lng: rideEnd.lng! },
              threshold_km
            )
            if (userStartInCorridor && userEndInCorridor) {
              onTheWay = true
              matchDetails.push(`Route liegt auf dem gleichen Weg`)
              const detour =
                calculateDistance(rideStart.lat, rideStart.lng!, userStart.lat, userStart.lng!) +
                calculateDistance(rideEnd.lat, rideEnd.lng!, userEnd.lat, userEnd.lng!)
              if (detour < minDistance) minDistance = detour
            }
          }

          // 9. "Same direction" fallback: if routes go in same direction and
          // start/end points are within 60km of each other (e.g., Köln→Berlin vs Düsseldorf→Potsdam)
          if (!onTheWay) {
            const sameDir = isSameDirectionRoute(
              { lat: userStart.lat, lng: userStart.lng! },
              { lat: userEnd.lat, lng: userEnd.lng! },
              { lat: rideStart.lat, lng: rideStart.lng! },
              { lat: rideEnd.lat, lng: rideEnd.lng! },
              60 // 60km max distance between start/end points
            )
            if (sameDir.isMatch) {
              onTheWay = true
              const avgDetour = Math.round((sameDir.startDistance + sameDir.endDistance) / 2)
              matchDetails.push(`Ähnliche Strecke (∅ ${avgDetour} km entfernt)`)
              const totalDetour = sameDir.startDistance + sameDir.endDistance
              if (totalDetour < minDistance) minDistance = totalDetour
            }
          }
        }

        // Derive match tier from best distance
        const matchTier: MatchTier = onTheWay ? getMatchTier(minDistance === Infinity ? 0 : minDistance) : "none"

        return {
          ...ride,
          similarity,
          onTheWay,
          matchTier,
          matchDetails: matchDetails.slice(0, 3), // Limit to 3 details
          minDistance: minDistance === Infinity ? null : Math.round(minDistance),
        }
      })
      .filter((ride) => ride.similarity >= 20 || ride.onTheWay)
      .sort((a, b) => {
        // Sort by: onTheWay first, then by tier (direct > small_detour > detour),
        // then by similarity, then by distance
        if (a.onTheWay && !b.onTheWay) return -1
        if (!a.onTheWay && b.onTheWay) return 1
        if (a.onTheWay && b.onTheWay) {
          const tierDiff = (TIER_RANK[b.matchTier] || 0) - (TIER_RANK[a.matchTier] || 0)
          if (tierDiff !== 0) return tierDiff
        }
        if (b.similarity !== a.similarity) return b.similarity - a.similarity
        return (a.minDistance || 999) - (b.minDistance || 999)
      })
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
    // Uses route_geometry (OSRM polyline) when available for accurate matching
    const nearbyRides = (rides as (RideWithUser & { route_geometry?: [number, number][] | null })[])
      .map((ride) => {
        const userPoint = { lat, lng }

        // Use detailed route (OSRM geometry if available) for accurate matching
        const detailedRoute = getDetailedRoute(ride)
        const routeCheck = isPointOnRoute(userPoint, detailedRoute, radius)

        return {
          ...ride,
          onRoute: routeCheck.onRoute,
          distance: Math.round(routeCheck.minDistance),
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
