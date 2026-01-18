"use client"

import { useEffect, useRef, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { MapPoint } from "./route-map"

// Custom colored markers
function createColoredIcon(color: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  })
}

// Click indicator icon
function createClickIndicator() {
  return L.divIcon({
    className: "click-indicator",
    html: `<div style="
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid #3b82f6;
      background: rgba(59, 130, 246, 0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

interface LeafletMapProps {
  points: MapPoint[]
  height: string
  interactive?: boolean
  onMapClick?: (lat: number, lng: number) => void
  /** Pre-calculated route geometry to display instead of straight lines */
  routeGeometry?: [number, number][]
}

export function LeafletMap({
  points,
  height,
  interactive = false,
  onMapClick,
  routeGeometry,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const polylineRef = useRef<L.Polyline | null>(null)
  const clickMarkerRef = useRef<L.Marker | null>(null)

  // Handle map click
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!interactive || !onMapClick) return

    const { lat, lng } = e.latlng

    // Show click indicator
    if (mapInstanceRef.current) {
      if (clickMarkerRef.current) {
        clickMarkerRef.current.remove()
      }
      clickMarkerRef.current = L.marker([lat, lng], {
        icon: createClickIndicator(),
      }).addTo(mapInstanceRef.current)

      // Remove after a short delay
      setTimeout(() => {
        clickMarkerRef.current?.remove()
        clickMarkerRef.current = null
      }, 1000)
    }

    onMapClick(lat, lng)
  }, [interactive, onMapClick])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Default center (Germany)
    const defaultCenter: L.LatLngExpression = [51.1657, 10.4515]

    mapInstanceRef.current = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: 6,
      zoomControl: true,
    })

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current)

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Add/remove click handler when interactive changes
  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (interactive && onMapClick) {
      mapInstanceRef.current.on("click", handleMapClick)
    }

    return () => {
      mapInstanceRef.current?.off("click", handleMapClick)
    }
  }, [interactive, onMapClick, handleMapClick])

  // Update markers and route when points or geometry change
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Remove existing polyline
    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    if (points.length === 0) return

    // Sort points by order
    const sortedPoints = [...points].sort((a, b) => a.order - b.order)

    // Add markers
    sortedPoints.forEach((point, index) => {
      const color =
        point.type === "start"
          ? "#22c55e" // green
          : point.type === "end"
            ? "#ef4444" // red
            : "#3b82f6" // blue

      const marker = L.marker([point.lat, point.lng], {
        icon: createColoredIcon(color),
      })
        .addTo(mapInstanceRef.current!)
        .bindPopup(`<strong>${index + 1}. ${point.type === "start" ? "Start" : point.type === "end" ? "Ziel" : "Stopp"}</strong><br/>${point.address}`)

      markersRef.current.push(marker)
    })

    // Draw route - use real geometry if available, otherwise fallback to straight dashed line
    if (sortedPoints.length >= 2) {
      if (routeGeometry && routeGeometry.length >= 2) {
        // Draw real route from OSRM
        polylineRef.current = L.polyline(routeGeometry, {
          color: "#3b82f6",
          weight: 5,
          opacity: 0.8,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(mapInstanceRef.current)

        // Fit bounds to route geometry
        const bounds = L.latLngBounds(routeGeometry)
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
      } else {
        // Fallback: dashed line between points (while loading or if routing fails)
        const latLngs: L.LatLngExpression[] = sortedPoints.map((p) => [p.lat, p.lng])
        polylineRef.current = L.polyline(latLngs, {
          color: "#3b82f6",
          weight: 4,
          opacity: 0.5,
          dashArray: "10, 10",
        }).addTo(mapInstanceRef.current)

        // Fit bounds to markers
        const bounds = L.latLngBounds(sortedPoints.map((p) => [p.lat, p.lng]))
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
      }
    } else if (sortedPoints.length === 1) {
      // Single point - center on it
      mapInstanceRef.current.setView([sortedPoints[0].lat, sortedPoints[0].lng], 12)
    }
  }, [points, routeGeometry])

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%", cursor: interactive ? "crosshair" : "grab" }}
    />
  )
}
