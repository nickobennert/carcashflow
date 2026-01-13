"use client"

import { useState, useRef, useEffect } from "react"
import { MapPin, Loader2, X, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getRecentLocations,
  saveRecentLocation,
  type SavedLocation,
} from "@/lib/location-storage"

interface LocationResult {
  id: string
  display_name: string
  lat: string
  lon: string
}

interface LocationSearchProps {
  value?: string
  onSelect: (location: { address: string; lat: number; lng: number }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  pinColor?: "start" | "stop" | "end"
  showRecent?: boolean
}

export function LocationSearch({
  value = "",
  onSelect,
  placeholder = "Adresse suchen...",
  className,
  disabled,
  pinColor,
  showRecent = true,
}: LocationSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<LocationResult[]>([])
  const [recentLocations, setRecentLocations] = useState<SavedLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showRecentList, setShowRecentList] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load recent locations on mount
  useEffect(() => {
    if (showRecent) {
      setRecentLocations(getRecentLocations())
    }
  }, [showRecent])

  // Search for locations using Nominatim (OpenStreetMap) - FREE!
  async function searchLocations(searchQuery: string) {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([])
      if (showRecent && recentLocations.length > 0) {
        setShowRecentList(true)
      }
      return
    }

    setIsLoading(true)
    setShowRecentList(false)

    try {
      // Nominatim API - completely free, no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=de,at,ch&limit=5&addressdetails=1`,
        {
          headers: {
            // Required by Nominatim usage policy
            "User-Agent": "FahrMit/1.0",
          },
        }
      )
      const data = await response.json()

      if (Array.isArray(data)) {
        setResults(
          data.map((item: { place_id: number; display_name: string; lat: string; lon: string }) => ({
            id: String(item.place_id),
            display_name: item.display_name,
            lat: item.lat,
            lon: item.lon,
          }))
        )
        setIsOpen(true)
      }
    } catch (error) {
      console.error("Error searching locations:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounce search (important for Nominatim rate limiting)
  function handleInputChange(newQuery: string) {
    setQuery(newQuery)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // 500ms debounce to respect Nominatim usage policy
    debounceRef.current = setTimeout(() => {
      searchLocations(newQuery)
    }, 500)
  }

  // Handle selection
  function handleSelect(result: LocationResult) {
    const shortName = shortenAddress(result.display_name)
    setQuery(shortName)
    setIsOpen(false)
    setShowRecentList(false)
    setResults([])

    const location = {
      address: shortName,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    }

    // Save to recent locations
    saveRecentLocation(location)
    setRecentLocations(getRecentLocations())

    onSelect(location)
  }

  // Handle recent location selection
  function handleRecentSelect(location: SavedLocation) {
    setQuery(location.address)
    setIsOpen(false)
    setShowRecentList(false)
    setResults([])

    // Update recent locations (move to top)
    saveRecentLocation(location)
    setRecentLocations(getRecentLocations())

    onSelect({
      address: location.address,
      lat: location.lat,
      lng: location.lng,
    })
  }

  // Clear input
  function handleClear() {
    setQuery("")
    setResults([])
    setIsOpen(false)
    setShowRecentList(false)
  }

  // Handle focus - show recent locations if no query
  function handleFocus() {
    if (!query && showRecent && recentLocations.length > 0) {
      setShowRecentList(true)
      setIsOpen(true)
    } else if (results.length > 0) {
      setIsOpen(true)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowRecentList(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value)
  }, [value])

  const pinColorClass = pinColor === "start"
    ? "text-offer"
    : pinColor === "end"
      ? "text-destructive"
      : "text-muted-foreground"

  const hasResults = results.length > 0
  const hasRecent = showRecentList && recentLocations.length > 0

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", pinColorClass)} />
        <Input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-16"
          disabled={disabled}
          onFocus={handleFocus}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {query && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {isOpen && (hasResults || hasRecent) && (
        <div className="absolute z-[100] mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {/* Recent locations */}
            {hasRecent && !hasResults && (
              <>
                <li className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Zuletzt verwendet
                </li>
                {recentLocations.map((location) => (
                  <li key={location.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => handleRecentSelect(location)}
                    >
                      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{location.address}</span>
                    </button>
                  </li>
                ))}
              </>
            )}

            {/* Search results */}
            {hasResults && results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => handleSelect(result)}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{result.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Reverse geocoding - convert coordinates to address
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "FahrMit/1.0",
        },
      }
    )
    const data = await response.json()

    if (data.display_name) {
      return shortenAddress(data.display_name)
    }
    return null
  } catch (error) {
    console.error("Error reverse geocoding:", error)
    return null
  }
}

// Helper to shorten Nominatim's verbose addresses
function shortenAddress(fullAddress: string): string {
  const parts = fullAddress.split(", ")
  // Take first 3-4 meaningful parts (street, city, region)
  if (parts.length > 4) {
    // Usually: Street, Number, District, City, Region, Postal, Country
    // We want: Street Number, City
    const relevant = parts.slice(0, 4).filter((p) => !p.match(/^\d{5}$/)) // Remove postal codes
    return relevant.slice(0, 3).join(", ")
  }
  return fullAddress
}
