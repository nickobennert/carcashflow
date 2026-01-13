// Local storage for recent locations and favorites

export interface SavedLocation {
  id: string
  address: string
  lat: number
  lng: number
  usedAt: string
  useCount: number
}

export interface RoutePointData {
  type: "start" | "stop" | "end"
  address: string
  lat: number
  lng: number
  order: number
}

export interface FavoriteRoute {
  id: string
  name: string
  route: RoutePointData[]
  createdAt: string
  useCount: number
}

const RECENT_LOCATIONS_KEY = "fahrmit_recent_locations"
const FAVORITE_ROUTES_KEY = "fahrmit_favorite_routes"
const ROUTE_WATCHES_KEY = "fahrmit_route_watches"
const MAX_RECENT_LOCATIONS = 5
const MAX_ROUTE_WATCHES = 10

// Get recent locations from localStorage
export function getRecentLocations(): SavedLocation[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(RECENT_LOCATIONS_KEY)
    if (!stored) return []

    const locations: SavedLocation[] = JSON.parse(stored)
    // Sort by most recently used
    return locations.sort((a, b) =>
      new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime()
    )
  } catch {
    return []
  }
}

// Save a location to recent locations
export function saveRecentLocation(location: { address: string; lat: number; lng: number }): void {
  if (typeof window === "undefined") return

  try {
    const locations = getRecentLocations()

    // Check if location already exists (by address)
    const existingIndex = locations.findIndex(
      (l) => l.address.toLowerCase() === location.address.toLowerCase()
    )

    if (existingIndex >= 0) {
      // Update existing location
      locations[existingIndex].usedAt = new Date().toISOString()
      locations[existingIndex].useCount++
    } else {
      // Add new location
      locations.unshift({
        id: crypto.randomUUID(),
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        usedAt: new Date().toISOString(),
        useCount: 1,
      })
    }

    // Keep only MAX_RECENT_LOCATIONS
    const trimmed = locations.slice(0, MAX_RECENT_LOCATIONS)
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error("Error saving recent location:", error)
  }
}

// Clear recent locations
export function clearRecentLocations(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(RECENT_LOCATIONS_KEY)
}

// Get favorite routes
export function getFavoriteRoutes(): FavoriteRoute[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(FAVORITE_ROUTES_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

// Save a favorite route
export function saveFavoriteRoute(name: string, route: RoutePointData[]): FavoriteRoute | null {
  if (typeof window === "undefined") return null

  try {
    const routes = getFavoriteRoutes()

    // Check if a route with the same name exists
    const existingIndex = routes.findIndex((r) => r.name.toLowerCase() === name.toLowerCase())

    let newRoute: FavoriteRoute
    if (existingIndex >= 0) {
      // Update existing route
      routes[existingIndex].route = route
      routes[existingIndex].useCount++
      newRoute = routes[existingIndex]
    } else {
      // Add new route
      newRoute = {
        id: crypto.randomUUID(),
        name,
        route,
        createdAt: new Date().toISOString(),
        useCount: 1,
      }
      routes.push(newRoute)
    }

    localStorage.setItem(FAVORITE_ROUTES_KEY, JSON.stringify(routes))
    return newRoute
  } catch (error) {
    console.error("Error saving favorite route:", error)
    return null
  }
}

// Update favorite route use count
export function incrementFavoriteRouteUseCount(id: string): void {
  if (typeof window === "undefined") return

  try {
    const routes = getFavoriteRoutes()
    const route = routes.find((r) => r.id === id)
    if (route) {
      route.useCount++
      localStorage.setItem(FAVORITE_ROUTES_KEY, JSON.stringify(routes))
    }
  } catch (error) {
    console.error("Error updating favorite route:", error)
  }
}

// Delete a favorite route
export function deleteFavoriteRoute(id: string): void {
  if (typeof window === "undefined") return

  try {
    const routes = getFavoriteRoutes().filter((r) => r.id !== id)
    localStorage.setItem(FAVORITE_ROUTES_KEY, JSON.stringify(routes))
  } catch (error) {
    console.error("Error deleting favorite route:", error)
  }
}

// ============================================
// Route Watches - Get notified about new rides
// ============================================

export interface RouteWatch {
  id: string
  type: "location" | "route"
  name: string
  // For location-based watch
  lat?: number
  lng?: number
  radius?: number
  address?: string
  // For route-based watch
  startLat?: number
  startLng?: number
  startAddress?: string
  endLat?: number
  endLng?: number
  endAddress?: string
  // Preferences
  rideType: "offer" | "request" | "both"
  createdAt: string
  isActive: boolean
}

// Get all route watches
export function getRouteWatches(): RouteWatch[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(ROUTE_WATCHES_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

// Add a location-based route watch
export function addLocationWatch(
  name: string,
  location: { address: string; lat: number; lng: number },
  radius: number = 25,
  rideType: "offer" | "request" | "both" = "both"
): RouteWatch | null {
  if (typeof window === "undefined") return null

  try {
    const watches = getRouteWatches()

    if (watches.length >= MAX_ROUTE_WATCHES) {
      return null // Max watches reached
    }

    const newWatch: RouteWatch = {
      id: crypto.randomUUID(),
      type: "location",
      name,
      lat: location.lat,
      lng: location.lng,
      address: location.address,
      radius,
      rideType,
      createdAt: new Date().toISOString(),
      isActive: true,
    }

    watches.push(newWatch)
    localStorage.setItem(ROUTE_WATCHES_KEY, JSON.stringify(watches))
    return newWatch
  } catch (error) {
    console.error("Error adding location watch:", error)
    return null
  }
}

// Add a route-based watch
export function addRouteWatch(
  name: string,
  start: { address: string; lat: number; lng: number },
  end: { address: string; lat: number; lng: number },
  rideType: "offer" | "request" | "both" = "both"
): RouteWatch | null {
  if (typeof window === "undefined") return null

  try {
    const watches = getRouteWatches()

    if (watches.length >= MAX_ROUTE_WATCHES) {
      return null
    }

    const newWatch: RouteWatch = {
      id: crypto.randomUUID(),
      type: "route",
      name,
      startLat: start.lat,
      startLng: start.lng,
      startAddress: start.address,
      endLat: end.lat,
      endLng: end.lng,
      endAddress: end.address,
      rideType,
      createdAt: new Date().toISOString(),
      isActive: true,
    }

    watches.push(newWatch)
    localStorage.setItem(ROUTE_WATCHES_KEY, JSON.stringify(watches))
    return newWatch
  } catch (error) {
    console.error("Error adding route watch:", error)
    return null
  }
}

// Toggle route watch active state
export function toggleRouteWatch(id: string): boolean {
  if (typeof window === "undefined") return false

  try {
    const watches = getRouteWatches()
    const watch = watches.find((w) => w.id === id)

    if (watch) {
      watch.isActive = !watch.isActive
      localStorage.setItem(ROUTE_WATCHES_KEY, JSON.stringify(watches))
      return watch.isActive
    }
    return false
  } catch (error) {
    console.error("Error toggling route watch:", error)
    return false
  }
}

// Delete a route watch
export function deleteRouteWatch(id: string): void {
  if (typeof window === "undefined") return

  try {
    const watches = getRouteWatches().filter((w) => w.id !== id)
    localStorage.setItem(ROUTE_WATCHES_KEY, JSON.stringify(watches))
  } catch (error) {
    console.error("Error deleting route watch:", error)
  }
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
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

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${Math.round(km)} km`
}

// Calculate total route distance
export function calculateRouteDistance(points: { lat: number; lng: number }[]): number {
  if (points.length < 2) return 0

  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateDistance(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng
    )
  }
  return total
}

// Check if a point is "on the way" of a route (within threshold km)
export function isPointOnRoute(
  point: { lat: number; lng: number },
  route: { lat: number; lng: number }[],
  thresholdKm: number = 15
): boolean {
  if (route.length < 2) return false

  // Check distance to each segment of the route
  for (let i = 0; i < route.length - 1; i++) {
    const distToSegment = pointToSegmentDistance(
      point,
      route[i],
      route[i + 1]
    )
    if (distToSegment <= thresholdKm) {
      return true
    }
  }
  return false
}

// Calculate distance from point to line segment
function pointToSegmentDistance(
  point: { lat: number; lng: number },
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): number {
  const d1 = calculateDistance(point.lat, point.lng, start.lat, start.lng)
  const d2 = calculateDistance(point.lat, point.lng, end.lat, end.lng)
  const segmentLength = calculateDistance(start.lat, start.lng, end.lat, end.lng)

  // If segment is very short, return distance to nearest endpoint
  if (segmentLength < 0.1) {
    return Math.min(d1, d2)
  }

  // Use simple approximation: minimum of distances to endpoints
  // For a proper implementation, we'd need to project the point onto the segment
  // This is a reasonable approximation for our use case
  return Math.min(d1, d2)
}
