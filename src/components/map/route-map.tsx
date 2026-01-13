"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

export interface MapPoint {
  id: string
  type: "start" | "stop" | "end"
  address: string
  lat: number
  lng: number
  order: number
}

interface RouteMapProps {
  points: MapPoint[]
  className?: string
  height?: string
  interactive?: boolean
  onMapClick?: (lat: number, lng: number) => void
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
}: RouteMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
      />
    </div>
  )
}
