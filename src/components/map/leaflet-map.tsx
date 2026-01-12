"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { MapPoint } from "./route-map"

// Fix for default marker icons in Leaflet with webpack/next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

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

interface LeafletMapProps {
  points: MapPoint[]
  height: string
}

export function LeafletMap({ points, height }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const polylineRef = useRef<L.Polyline | null>(null)

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

  // Update markers when points change
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

    // Draw polyline connecting points
    if (sortedPoints.length >= 2) {
      const latLngs: L.LatLngExpression[] = sortedPoints.map((p) => [p.lat, p.lng])
      polylineRef.current = L.polyline(latLngs, {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 10",
      }).addTo(mapInstanceRef.current)
    }

    // Fit bounds to show all markers
    if (sortedPoints.length > 0) {
      const bounds = L.latLngBounds(sortedPoints.map((p) => [p.lat, p.lng]))
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    }
  }, [points])

  return <div ref={mapRef} style={{ height, width: "100%" }} />
}
