/**
 * OSRM (Open Source Routing Machine) Service
 *
 * Uses the free OSRM demo server for development.
 * For production, consider self-hosting or using OpenRouteService.
 *
 * Demo server: https://router.project-osrm.org
 * No API key required, but rate-limited.
 */

export interface RoutePoint {
  lat: number
  lng: number
}

export interface RouteStep {
  distance: number // meters
  duration: number // seconds
  instruction: string
  name: string // road name
  maneuver: {
    type: string
    modifier?: string
    location: [number, number] // [lng, lat]
  }
}

export interface RouteResult {
  distance: number // total distance in meters
  duration: number // total duration in seconds
  geometry: [number, number][] // Array of [lat, lng] coordinates
  steps: RouteStep[]
  waypoints: {
    name: string
    location: [number, number] // [lng, lat]
  }[]
}

// OSRM API Response types
interface OSRMResponse {
  code: string
  routes?: OSRMRoute[]
  waypoints?: OSRMWaypoint[]
  message?: string
}

interface OSRMRoute {
  distance: number
  duration: number
  geometry: string | GeoJSONGeometry
  legs: OSRMLeg[]
}

interface GeoJSONGeometry {
  type: string
  coordinates: [number, number][]
}

interface OSRMLeg {
  distance: number
  duration: number
  steps: OSRMStep[]
}

interface OSRMStep {
  distance: number
  duration: number
  name: string
  maneuver: {
    type: string
    modifier?: string
    location: [number, number]
  }
}

interface OSRMWaypoint {
  name: string
  location: [number, number]
}

// OSRM Demo Server (free, no API key needed)
const OSRM_BASE_URL = "https://router.project-osrm.org"

// Custom error codes for routing issues
export const ROUTING_ERROR_CODES = {
  OSRM_OVERLOADED: "ROUTING_SERVICE_OVERLOADED",
  OSRM_UNAVAILABLE: "ROUTING_SERVICE_UNAVAILABLE",
  OSRM_RATE_LIMITED: "ROUTING_RATE_LIMITED",
  OSRM_TIMEOUT: "ROUTING_TIMEOUT",
  NO_ROUTE_FOUND: "NO_ROUTE_FOUND",
  INVALID_COORDINATES: "INVALID_COORDINATES",
} as const

export type RoutingErrorCode = typeof ROUTING_ERROR_CODES[keyof typeof ROUTING_ERROR_CODES]

export class RoutingError extends Error {
  code: RoutingErrorCode
  isServerOverloaded: boolean

  constructor(code: RoutingErrorCode, message: string) {
    super(message)
    this.name = "RoutingError"
    this.code = code
    this.isServerOverloaded = [
      ROUTING_ERROR_CODES.OSRM_OVERLOADED,
      ROUTING_ERROR_CODES.OSRM_RATE_LIMITED,
      ROUTING_ERROR_CODES.OSRM_TIMEOUT,
    ].includes(code)
  }
}

/**
 * Decode a polyline string into coordinates
 * OSRM uses Google's polyline encoding by default
 */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte: number

    // Decode latitude
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const dlat = result & 1 ? ~(result >> 1) : result >> 1
    lat += dlat

    // Decode longitude
    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const dlng = result & 1 ? ~(result >> 1) : result >> 1
    lng += dlng

    // OSRM returns coordinates with 5 decimal precision (1e5)
    points.push([lat / 1e5, lng / 1e5])
  }

  return points
}

/**
 * Generate turn-by-turn instruction from OSRM maneuver
 */
function getInstruction(step: OSRMStep): string {
  const { maneuver, name } = step
  const roadName = name || "der Straße"

  const instructions: Record<string, Record<string, string>> = {
    turn: {
      left: `Links abbiegen auf ${roadName}`,
      right: `Rechts abbiegen auf ${roadName}`,
      "slight left": `Leicht links auf ${roadName}`,
      "slight right": `Leicht rechts auf ${roadName}`,
      "sharp left": `Scharf links auf ${roadName}`,
      "sharp right": `Scharf rechts auf ${roadName}`,
      straight: `Geradeaus auf ${roadName}`,
      uturn: `Wenden auf ${roadName}`,
    },
    "new name": {
      default: `Weiter auf ${roadName}`,
    },
    depart: {
      default: `Starten auf ${roadName}`,
    },
    arrive: {
      default: "Ziel erreicht",
    },
    merge: {
      default: `Einfädeln auf ${roadName}`,
    },
    "on ramp": {
      default: `Auffahrt nehmen auf ${roadName}`,
    },
    "off ramp": {
      default: `Abfahrt nehmen auf ${roadName}`,
    },
    fork: {
      left: `Links halten auf ${roadName}`,
      right: `Rechts halten auf ${roadName}`,
      "slight left": `Leicht links halten auf ${roadName}`,
      "slight right": `Leicht rechts halten auf ${roadName}`,
    },
    "end of road": {
      left: `Am Ende links auf ${roadName}`,
      right: `Am Ende rechts auf ${roadName}`,
    },
    continue: {
      default: `Weiter auf ${roadName}`,
    },
    roundabout: {
      default: `Im Kreisverkehr auf ${roadName}`,
    },
    rotary: {
      default: `Im Kreisverkehr auf ${roadName}`,
    },
    "roundabout turn": {
      default: `Im Kreisverkehr auf ${roadName}`,
    },
    notification: {
      default: roadName,
    },
    "exit roundabout": {
      default: `Kreisverkehr verlassen auf ${roadName}`,
    },
    "exit rotary": {
      default: `Kreisverkehr verlassen auf ${roadName}`,
    },
  }

  const typeInstructions = instructions[maneuver.type]
  if (!typeInstructions) {
    return `Weiter auf ${roadName}`
  }

  const modifier = maneuver.modifier || "default"
  return typeInstructions[modifier] || typeInstructions.default || `Weiter auf ${roadName}`
}

/**
 * Calculate route between multiple points using OSRM
 * @throws {RoutingError} When routing service has issues (check error.code)
 */
export async function calculateRoute(points: RoutePoint[]): Promise<RouteResult | null> {
  if (points.length < 2) {
    console.error("At least 2 points are required for routing")
    throw new RoutingError(
      ROUTING_ERROR_CODES.INVALID_COORDINATES,
      "Mindestens 2 Punkte für die Routenberechnung erforderlich"
    )
  }

  // Validate coordinates
  for (const point of points) {
    if (!point.lat || !point.lng || isNaN(point.lat) || isNaN(point.lng)) {
      throw new RoutingError(
        ROUTING_ERROR_CODES.INVALID_COORDINATES,
        "Ungültige Koordinaten für die Routenberechnung"
      )
    }
  }

  // Build coordinates string: lng,lat;lng,lat;...
  const coordinates = points
    .map((p) => `${p.lng},${p.lat}`)
    .join(";")

  const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=polyline&steps=true&annotations=false`

  try {
    // Add timeout for OSRM requests (15 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Handle HTTP errors with specific codes
    if (!response.ok) {
      const status = response.status
      console.error("OSRM API error:", status, response.statusText)

      // 429 = Rate Limited
      if (status === 429) {
        throw new RoutingError(
          ROUTING_ERROR_CODES.OSRM_RATE_LIMITED,
          "Routing-Server ist überlastet (Rate Limit). Bitte versuche es in ein paar Minuten erneut."
        )
      }

      // 503 = Service Unavailable (often means overloaded)
      if (status === 503) {
        throw new RoutingError(
          ROUTING_ERROR_CODES.OSRM_OVERLOADED,
          "Routing-Server ist überlastet. Bitte versuche es später erneut."
        )
      }

      // 502 or 504 = Gateway issues (also often overload)
      if (status === 502 || status === 504) {
        throw new RoutingError(
          ROUTING_ERROR_CODES.OSRM_OVERLOADED,
          "Routing-Server ist momentan nicht erreichbar. Bitte versuche es später erneut."
        )
      }

      // 500+ = Server errors
      if (status >= 500) {
        throw new RoutingError(
          ROUTING_ERROR_CODES.OSRM_UNAVAILABLE,
          "Routing-Server ist momentan nicht verfügbar. Bitte versuche es später erneut."
        )
      }

      // Other errors
      throw new RoutingError(
        ROUTING_ERROR_CODES.OSRM_UNAVAILABLE,
        `Routing-Fehler (HTTP ${status})`
      )
    }

    const data: OSRMResponse = await response.json()

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      console.error("OSRM routing failed:", data.message || data.code)

      // Check for specific OSRM error codes
      if (data.code === "NoRoute") {
        throw new RoutingError(
          ROUTING_ERROR_CODES.NO_ROUTE_FOUND,
          "Keine Route zwischen diesen Punkten gefunden"
        )
      }

      throw new RoutingError(
        ROUTING_ERROR_CODES.NO_ROUTE_FOUND,
        data.message || "Routenberechnung fehlgeschlagen"
      )
    }

    const route = data.routes[0]

    // Decode geometry
    let geometry: [number, number][]
    if (typeof route.geometry === "string") {
      geometry = decodePolyline(route.geometry)
    } else {
      // GeoJSON format: coordinates are [lng, lat], need to swap to [lat, lng]
      geometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
    }

    // Extract steps from all legs
    const steps: RouteStep[] = []
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        steps.push({
          distance: step.distance,
          duration: step.duration,
          instruction: getInstruction(step),
          name: step.name,
          maneuver: step.maneuver,
        })
      }
    }

    return {
      distance: route.distance,
      duration: route.duration,
      geometry,
      steps,
      waypoints: data.waypoints?.map((wp) => ({
        name: wp.name,
        location: wp.location,
      })) || [],
    }
  } catch (error) {
    // Re-throw RoutingErrors
    if (error instanceof RoutingError) {
      throw error
    }

    // Handle abort/timeout
    if (error instanceof Error && error.name === "AbortError") {
      console.error("OSRM request timed out")
      throw new RoutingError(
        ROUTING_ERROR_CODES.OSRM_TIMEOUT,
        "Routing-Server antwortet nicht (Timeout). Der Server ist möglicherweise überlastet."
      )
    }

    // Handle network errors (often indicates server overload or connectivity issues)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("Network error during routing:", error)
      throw new RoutingError(
        ROUTING_ERROR_CODES.OSRM_UNAVAILABLE,
        "Verbindung zum Routing-Server fehlgeschlagen. Bitte prüfe deine Internetverbindung."
      )
    }

    console.error("Failed to calculate route:", error)
    throw new RoutingError(
      ROUTING_ERROR_CODES.OSRM_UNAVAILABLE,
      "Unerwarteter Fehler bei der Routenberechnung"
    )
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours} Std ${minutes} Min`
  }
  return `${minutes} Min`
}

/**
 * Check if a point is near the route (within threshold)
 * Uses perpendicular distance to route segments
 */
export function isPointNearRoute(
  point: RoutePoint,
  routeGeometry: [number, number][],
  thresholdKm: number = 5
): boolean {
  const R = 6371 // Earth's radius in km

  for (let i = 0; i < routeGeometry.length - 1; i++) {
    const [lat1, lng1] = routeGeometry[i]
    const [lat2, lng2] = routeGeometry[i + 1]

    // Calculate distance from point to line segment
    const distance = pointToSegmentDistance(
      point.lat, point.lng,
      lat1, lng1,
      lat2, lng2,
      R
    )

    if (distance <= thresholdKm) {
      return true
    }
  }

  return false
}

/**
 * Calculate distance from a point to a line segment using Haversine
 */
function pointToSegmentDistance(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number,
  R: number
): number {
  // Convert to radians
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const pLatRad = toRad(pLat)
  const pLngRad = toRad(pLng)
  const aLatRad = toRad(aLat)
  const aLngRad = toRad(aLng)
  const bLatRad = toRad(bLat)
  const bLngRad = toRad(bLng)

  // Distance from point to start of segment
  const distToA = haversineRad(pLatRad, pLngRad, aLatRad, aLngRad, R)

  // Distance from point to end of segment
  const distToB = haversineRad(pLatRad, pLngRad, bLatRad, bLngRad, R)

  // Length of segment
  const segmentLength = haversineRad(aLatRad, aLngRad, bLatRad, bLngRad, R)

  // If segment is very short, return distance to midpoint
  if (segmentLength < 0.001) {
    return distToA
  }

  // Calculate cross-track distance (perpendicular distance)
  // Using spherical geometry approximation
  const bearing1 = Math.atan2(
    Math.sin(bLngRad - aLngRad) * Math.cos(bLatRad),
    Math.cos(aLatRad) * Math.sin(bLatRad) - Math.sin(aLatRad) * Math.cos(bLatRad) * Math.cos(bLngRad - aLngRad)
  )

  const bearing2 = Math.atan2(
    Math.sin(pLngRad - aLngRad) * Math.cos(pLatRad),
    Math.cos(aLatRad) * Math.sin(pLatRad) - Math.sin(aLatRad) * Math.cos(pLatRad) * Math.cos(pLngRad - aLngRad)
  )

  const crossTrack = Math.abs(Math.asin(Math.sin(distToA / R) * Math.sin(bearing2 - bearing1)) * R)

  // Check if the perpendicular falls within the segment
  const alongTrack = Math.acos(Math.cos(distToA / R) / Math.cos(crossTrack / R)) * R

  if (alongTrack > segmentLength) {
    // Point is beyond the segment, return distance to closer endpoint
    return Math.min(distToA, distToB)
  }

  return crossTrack
}

/**
 * Haversine distance calculation using radians
 */
function haversineRad(lat1: number, lng1: number, lat2: number, lng2: number, R: number): number {
  const dLat = lat2 - lat1
  const dLng = lng2 - lng1

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}
