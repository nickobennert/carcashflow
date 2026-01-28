"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon, X, Search, MapPin, Navigation, Route } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { LocationSearch } from "@/components/map/location-search"
import { RouteWatchManager } from "./route-watch-manager"

type NearbySearchMode = "location" | "route"

interface RideFiltersProps {
  className?: string
}

export function RideFilters({ className }: RideFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [type, setType] = useState(searchParams.get("type") || "all")
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [date, setDate] = useState<Date | undefined>(
    searchParams.get("date") ? new Date(searchParams.get("date")!) : undefined
  )

  // "Unterwegs" filter state
  const [nearbyMode, setNearbyMode] = useState(
    !!(searchParams.get("nearby_lat") || searchParams.get("match_start_lat"))
  )
  const [nearbySearchMode, setNearbySearchMode] = useState<NearbySearchMode>(
    searchParams.get("match_start_lat") ? "route" : "location"
  )

  // Single location state
  const [nearbyLat, setNearbyLat] = useState<number | null>(
    searchParams.get("nearby_lat") ? parseFloat(searchParams.get("nearby_lat")!) : null
  )
  const [nearbyLng, setNearbyLng] = useState<number | null>(
    searchParams.get("nearby_lng") ? parseFloat(searchParams.get("nearby_lng")!) : null
  )
  const [nearbyAddress, setNearbyAddress] = useState(searchParams.get("nearby_address") || "")
  const [nearbyRadius, setNearbyRadius] = useState(
    searchParams.get("nearby_radius") ? parseInt(searchParams.get("nearby_radius")!) : 25
  )

  // Route search state (two points)
  const [routeStart, setRouteStart] = useState<{ address: string; lat: number; lng: number } | null>(
    searchParams.get("match_start_lat")
      ? {
          address: searchParams.get("match_start_address") || "",
          lat: parseFloat(searchParams.get("match_start_lat")!),
          lng: parseFloat(searchParams.get("match_start_lng")!),
        }
      : null
  )
  const [routeEnd, setRouteEnd] = useState<{ address: string; lat: number; lng: number } | null>(
    searchParams.get("match_end_lat")
      ? {
          address: searchParams.get("match_end_address") || "",
          lat: parseFloat(searchParams.get("match_end_lat")!),
          lng: parseFloat(searchParams.get("match_end_lng")!),
        }
      : null
  )

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    router.push(`/dashboard?${params.toString()}`)
  }

  function clearFilters() {
    setType("all")
    setSearch("")
    setDate(undefined)
    setNearbyMode(false)
    setNearbyLat(null)
    setNearbyLng(null)
    setNearbyAddress("")
    setNearbyRadius(25)
    setRouteStart(null)
    setRouteEnd(null)
    router.push("/dashboard")
  }

  function handleNearbyLocationSelect(location: { address: string; lat: number; lng: number }) {
    setNearbyAddress(location.address)
    setNearbyLat(location.lat)
    setNearbyLng(location.lng)

    updateFilters({
      nearby_lat: location.lat.toString(),
      nearby_lng: location.lng.toString(),
      nearby_address: location.address,
      nearby_radius: nearbyRadius.toString(),
      // Clear route params when using single location
      match_start_lat: null,
      match_start_lng: null,
      match_end_lat: null,
      match_end_lng: null,
      match_start_address: null,
      match_end_address: null,
      match_type: null,
    })
  }

  function handleRouteStartSelect(location: { address: string; lat: number; lng: number }) {
    setRouteStart(location)
    // If end is also set, trigger search immediately
    if (routeEnd) {
      updateFilters({
        match_start_lat: location.lat.toString(),
        match_start_lng: location.lng.toString(),
        match_start_address: location.address,
        match_end_lat: routeEnd.lat.toString(),
        match_end_lng: routeEnd.lng.toString(),
        match_end_address: routeEnd.address,
        match_type: type !== "all" ? (type === "offer" ? "request" : "offer") : "offer",
        // Clear single location params
        nearby_lat: null,
        nearby_lng: null,
        nearby_address: null,
        nearby_radius: null,
      })
    }
  }

  function handleRouteEndSelect(location: { address: string; lat: number; lng: number }) {
    setRouteEnd(location)
    // If start is also set, trigger search immediately
    if (routeStart) {
      updateFilters({
        match_start_lat: routeStart.lat.toString(),
        match_start_lng: routeStart.lng.toString(),
        match_start_address: routeStart.address,
        match_end_lat: location.lat.toString(),
        match_end_lng: location.lng.toString(),
        match_end_address: location.address,
        match_type: type !== "all" ? (type === "offer" ? "request" : "offer") : "offer",
        // Clear single location params
        nearby_lat: null,
        nearby_lng: null,
        nearby_address: null,
        nearby_radius: null,
      })
    }
  }

  function clearNearby() {
    setNearbyMode(false)
    setNearbyLat(null)
    setNearbyLng(null)
    setNearbyAddress("")
    setRouteStart(null)
    setRouteEnd(null)
    updateFilters({
      nearby_lat: null,
      nearby_lng: null,
      nearby_address: null,
      nearby_radius: null,
      match_start_lat: null,
      match_start_lng: null,
      match_end_lat: null,
      match_end_lng: null,
      match_start_address: null,
      match_end_address: null,
      match_type: null,
      match_date: null,
    })
  }

  const hasActiveFilters = type !== "all" || search || date || (nearbyLat && nearbyLng) || routeStart
  const hasRouteSearch = !!(routeStart && routeEnd)
  const hasLocationSearch = !!(nearbyLat && nearbyLng)

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        {/* Type Filter */}
        <Select
          value={type}
          onValueChange={(value) => {
            setType(value)
            updateFilters({ type: value })
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Alle Typen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Routen</SelectItem>
            <SelectItem value="offer">Nur Angebote</SelectItem>
            <SelectItem value="request">Nur Gesuche</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[180px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: de }) : "Datum filtern"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" side="bottom" avoidCollisions>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate)
                updateFilters({
                  date: newDate ? format(newDate, "yyyy-MM-dd") : null,
                })
              }}
              locale={de}
              autoFocus
            />
          </PopoverContent>
        </Popover>

        {/* "Unterwegs" Filter Toggle */}
        <Button
          variant={nearbyMode ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (nearbyMode) {
              clearNearby()
            } else {
              setNearbyMode(true)
            }
          }}
          className={cn(
            "gap-2",
            (hasLocationSearch || hasRouteSearch) && "bg-offer text-white hover:bg-offer/90"
          )}
        >
          <Navigation className="h-4 w-4" />
          Unterwegs
        </Button>

        {/* Route Watch Manager */}
        <RouteWatchManager />

        {/* Search */}
        {!nearbyMode && (
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Stadt oder Adresse suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateFilters({ search })
                }
              }}
              onBlur={() => updateFilters({ search })}
              className="pl-9"
            />
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Filter zurücksetzen
          </Button>
        )}
      </div>

      {/* "Unterwegs" Search Panel */}
      {nearbyMode && (
        <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
          {/* Mode Toggle: Ort vs. Strecke */}
          <div className="flex items-center gap-2">
            <Button
              variant={nearbySearchMode === "location" ? "default" : "outline"}
              size="sm"
              onClick={() => setNearbySearchMode("location")}
              className="gap-1.5 h-8 text-xs"
            >
              <MapPin className="h-3.5 w-3.5" />
              Ort
            </Button>
            <Button
              variant={nearbySearchMode === "route" ? "default" : "outline"}
              size="sm"
              onClick={() => setNearbySearchMode("route")}
              className="gap-1.5 h-8 text-xs"
            >
              <Route className="h-3.5 w-3.5" />
              Strecke
            </Button>
            <span className="text-xs text-muted-foreground ml-2">
              {nearbySearchMode === "location"
                ? "Zeige Fahrten die durch einen Ort führen"
                : "Zeige Fahrten auf deiner Strecke"}
            </span>
          </div>

          {/* Single Location Mode */}
          {nearbySearchMode === "location" && (
            <div className="space-y-3">
              <LocationSearch
                value={nearbyAddress}
                onSelect={handleNearbyLocationSelect}
                placeholder="Deinen Standort oder Wunschort eingeben..."
                showRecent={true}
              />

              {nearbyLat && nearbyLng && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Umkreis</span>
                    <span className="font-medium">{nearbyRadius} km</span>
                  </div>
                  <Slider
                    value={[nearbyRadius]}
                    onValueChange={([value]) => {
                      setNearbyRadius(value)
                      updateFilters({ nearby_radius: value.toString() })
                    }}
                    min={5}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {/* Route Search Mode (Two Points) */}
          {nearbySearchMode === "route" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center pt-3 shrink-0">
                  <div className="h-2.5 w-2.5 rounded-full bg-offer" />
                  <div className="w-0.5 h-8 bg-border" />
                  <div className="h-2.5 w-2.5 rounded-full bg-request" />
                </div>
                <div className="flex-1 space-y-2">
                  <LocationSearch
                    value={routeStart?.address || ""}
                    onSelect={handleRouteStartSelect}
                    placeholder="Von (Startort)..."
                    showRecent={true}
                  />
                  <LocationSearch
                    value={routeEnd?.address || ""}
                    onSelect={handleRouteEndSelect}
                    placeholder="Nach (Zielort)..."
                    showRecent={true}
                  />
                </div>
              </div>
              {routeStart && !routeEnd && (
                <p className="text-xs text-muted-foreground">
                  Gib einen Zielort ein, um passende Fahrten zu finden
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {type !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {type === "offer" ? "Angebote" : "Gesuche"}
              <button
                onClick={() => {
                  setType("all")
                  updateFilters({ type: "all" })
                }}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {date && (
            <Badge variant="secondary" className="gap-1">
              {format(date, "d. MMM yyyy", { locale: de })}
              <button
                onClick={() => {
                  setDate(undefined)
                  updateFilters({ date: null })
                }}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {search && !nearbyMode && (
            <Badge variant="secondary" className="gap-1">
              &ldquo;{search}&rdquo;
              <button
                onClick={() => {
                  setSearch("")
                  updateFilters({ search: null })
                }}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {hasLocationSearch && nearbySearchMode === "location" && (
            <Badge variant="secondary" className="gap-1 bg-offer/20 text-offer border-offer/30">
              <Navigation className="h-3 w-3 mr-1" />
              {nearbyAddress.split(",")[0]} ({nearbyRadius} km)
              <button
                onClick={clearNearby}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {hasRouteSearch && (
            <Badge variant="secondary" className="gap-1 bg-offer/20 text-offer border-offer/30">
              <Route className="h-3 w-3 mr-1" />
              {routeStart!.address.split(",")[0]} → {routeEnd!.address.split(",")[0]}
              <button
                onClick={clearNearby}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
