"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon, X, Search, MapPin, Navigation } from "lucide-react"

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
  const [nearbyMode, setNearbyMode] = useState(false)
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
    })
  }

  function clearNearby() {
    setNearbyMode(false)
    setNearbyLat(null)
    setNearbyLng(null)
    setNearbyAddress("")
    updateFilters({
      nearby_lat: null,
      nearby_lng: null,
      nearby_address: null,
      nearby_radius: null,
    })
  }

  const hasActiveFilters = type !== "all" || search || date || (nearbyLat && nearbyLng)

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
          onClick={() => setNearbyMode(!nearbyMode)}
          className={cn(
            "gap-2",
            nearbyLat && nearbyLng && "bg-offer text-white hover:bg-offer/90"
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

      {/* "Unterwegs" Location Search */}
      {nearbyMode && (
        <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-offer" />
            Zeige Fahrten die durch einen Ort führen
          </div>

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
          {nearbyAddress && nearbyLat && nearbyLng && (
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
        </div>
      )}
    </div>
  )
}
