/**
 * Route Watch Trigger Service
 *
 * Checks if a new ride matches any active route watches and sends notifications
 */

import { createAdminClient } from "@/lib/supabase/admin"
import { sendPushToMultiple, type PushSubscriptionData } from "@/lib/push/server"

interface RoutePoint {
  type: "start" | "stop" | "end"
  address: string
  lat?: number
  lng?: number
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

// Check if a route matches a location watch
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

// Check if a route matches a route watch
function matchesRouteWatch(
  watch: RouteWatch,
  route: RoutePoint[],
  thresholdKm: number = 20
): { matches: boolean } {
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

  return { matches: Boolean(startMatch && endMatch) }
}

/**
 * Trigger route watches for a new ride
 * Creates in-app notifications and sends push notifications
 */
export async function triggerRouteWatches(
  rideId: string,
  route: RoutePoint[],
  rideType: "offer" | "request",
  creatorUserId: string
): Promise<{ matchedCount: number; notificationsSent: number; pushSent: number }> {
  try {
    const adminClient = createAdminClient()

    // Get all active watches from OTHER users that match this ride type
    const { data: watches, error: watchError } = await adminClient
      .from("route_watches")
      .select("*")
      .eq("is_active", true)
      .neq("user_id", creatorUserId) // Don't notify the ride creator

    if (watchError) {
      console.error("Error fetching watches:", watchError)
      return { matchedCount: 0, notificationsSent: 0, pushSent: 0 }
    }

    // Filter watches that match the ride type
    const eligibleWatches = (watches || []).filter((w: RouteWatch) =>
      w.ride_type === "both" || w.ride_type === rideType
    ) as RouteWatch[]

    const matchedWatches: Array<{
      watch: RouteWatch
      details: string
    }> = []

    // Check each watch for matches
    for (const watch of eligibleWatches) {
      if (watch.type === "location") {
        const locationMatch = matchesLocationWatch(watch, route)
        if (locationMatch.matches) {
          matchedWatches.push({
            watch,
            details: `Route passiert ${watch.location_address?.split(",")[0] || "deinen Ort"}`,
          })
        }
      } else if (watch.type === "route") {
        const routeMatch = matchesRouteWatch(watch, route)
        if (routeMatch.matches) {
          matchedWatches.push({
            watch,
            details: `${watch.start_address?.split(",")[0]} → ${watch.end_address?.split(",")[0]}`,
          })
        }
      }
    }

    if (matchedWatches.length === 0) {
      return { matchedCount: 0, notificationsSent: 0, pushSent: 0 }
    }

    // Create in-app notifications
    const notificationsToCreate = matchedWatches.map(({ watch, details }) => ({
      user_id: watch.user_id,
      type: "ride_match" as const,
      title: rideType === "offer" ? "Neue passende Fahrt!" : "Neue Mitfahranfrage!",
      message: `${watch.name}: ${details}`,
      data: {
        ride_id: rideId,
        watch_id: watch.id,
        watch_name: watch.name,
      },
    }))

    const { error: notifError } = await adminClient
      .from("notifications")
      .insert(notificationsToCreate as never)

    if (notifError) {
      console.error("Error creating route watch notifications:", notifError)
    }

    // Send push notifications to users with push enabled
    let pushSent = 0
    const usersToNotify = [...new Set(matchedWatches.map(m => m.watch.user_id))]

    for (const userId of usersToNotify) {
      // Check if user has push enabled
      const { data: profile } = await adminClient
        .from("profiles")
        .select("push_enabled")
        .eq("id", userId)
        .single()

      const profileWithPush = profile as { push_enabled: boolean } | null
      if (!profileWithPush?.push_enabled) continue

      // Get push subscriptions
      const { data: subscriptions } = await adminClient
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId)

      if (!subscriptions || subscriptions.length === 0) continue

      // Get the matches for this user
      const userMatches = matchedWatches.filter(m => m.watch.user_id === userId)
      const matchDetails = userMatches.map(m => m.watch.name).join(", ")

      const pushResult = await sendPushToMultiple(
        subscriptions as PushSubscriptionData[],
        {
          title: rideType === "offer" ? "Neue passende Fahrt!" : "Neue Mitfahranfrage!",
          body: matchDetails,
          tag: `ride-match-${rideId}`,
          data: {
            url: `/rides/${rideId}`,
            rideId,
          },
        }
      )

      pushSent += pushResult.sent

      // Clean up expired subscriptions
      if (pushResult.expired.length > 0) {
        await adminClient
          .from("push_subscriptions")
          .delete()
          .in("endpoint", pushResult.expired)
      }
    }

    console.log(`Route watch trigger: ${matchedWatches.length} matches, ${notificationsToCreate.length} notifications, ${pushSent} push sent`)

    return {
      matchedCount: matchedWatches.length,
      notificationsSent: notificationsToCreate.length,
      pushSent,
    }
  } catch (error) {
    console.error("Error in triggerRouteWatches:", error)
    return { matchedCount: 0, notificationsSent: 0, pushSent: 0 }
  }
}
