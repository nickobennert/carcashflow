"use client"

import { useSyncExternalStore, useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import { calculateRoute, formatDistance, formatDuration, type RouteResult } from "@/lib/routing"

export interface MapPoint {
  id: string
  type: "start" | "stop" | "end"
  address: string
  lat: number
  lng: number
  order: number
}

export interface RouteInfo {
  distance: number
  duration: number
  geometry: [number, number][]
}

interface RouteMapProps {
  points: MapPoint[]
  className?: string
  height?: string
  interactive?: boolean
  onMapClick?: (lat: number, lng: number) => void
  onRouteCalculated?: (route: RouteInfo | null) => void
  showRouteInfo?: boolean
  /** Pre-calculated route geometry (for display only, skips routing API) */
  routeGeometry?: [number, number][]
}

// Hook to safely detect client-side mounting without triggering lint warnings
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

// Dynamically import the Leaflet map component (client-side only)
const LeafletMap = dynamic(() => import("./leaflet-map").then((mod) => mod.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center rounded-lg">
      <span className="text-muted-foreground text-sm">Karte wird geladen...</span>
    </div>
  ),
})

export function RouteMap({
  points,
  className,
  height = "400px",
  interactive = false,
  onMapClick,
  onRouteCalculated,
  showRouteInfo = false,
  routeGeometry: preCalculatedGeometry,
}: RouteMapProps) {
  const isMounted = useIsMounted()
  const [routeData, setRouteData] = useState<RouteResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Calculate route when points change
  const fetchRoute = useCallback(async () => {
    // Skip if we have pre-calculated geometry or not enough points
    if (preCalculatedGeometry || points.length < 2) {
      setRouteData(null)
      onRouteCalculated?.(null)
      return
    }

    // Sort points by order
    const sortedPoints = [...points].sort((a, b) => a.order - b.order)

    setIsCalculating(true)
    try {
      const result = await calculateRoute(
        sortedPoints.map((p) => ({ lat: p.lat, lng: p.lng }))
      )

      setRouteData(result)

      if (result) {
        onRouteCalculated?.({
          distance: result.distance,
          duration: result.duration,
          geometry: result.geometry,
        })
      } else {
        onRouteCalculated?.(null)
      }
    } catch (error) {
      console.error("Route calculation failed:", error)
      setRouteData(null)
      onRouteCalculated?.(null)
    } finally {
      setIsCalculating(false)
    }
  }, [points, preCalculatedGeometry, onRouteCalculated])

  useEffect(() => {
    fetchRoute()
  }, [fetchRoute])

  // Use pre-calculated geometry or calculated route geometry
  const displayGeometry = preCalculatedGeometry || routeData?.geometry

  if (!isMounted) {
    return (
      <div
        className={cn("rounded-lg overflow-hidden bg-muted animate-pulse flex items-center justify-center", className)}
        style={{ height }}
      >
        <span className="text-muted-foreground text-sm">Karte wird geladen...</span>
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg overflow-hidden relative isolate", className)} style={{ height }}>
      <LeafletMap
        points={points}
        height={height}
        interactive={interactive}
        onMapClick={onMapClick}
        routeGeometry={displayGeometry}
      />

      {/* Route info overlay */}
      {showRouteInfo && routeData && !isCalculating && (
        <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border text-sm z-[1000]">
          <div className="flex items-center gap-3">
            <span className="font-medium">{formatDistance(routeData.distance)}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{formatDuration(routeData.duration)}</span>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isCalculating && (
        <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border text-sm z-[1000]">
          <span className="text-muted-foreground">Route wird berechnet...</span>
        </div>
      )}
    </div>
  )
}
