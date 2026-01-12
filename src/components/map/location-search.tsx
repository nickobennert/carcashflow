"use client"

import { useState, useRef, useEffect } from "react"
import { MapPin, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
}

export function LocationSearch({
  value = "",
  onSelect,
  placeholder = "Adresse suchen...",
  className,
  disabled,
  pinColor,
}: LocationSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<LocationResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Search for locations using Nominatim (OpenStreetMap) - FREE!
  async function searchLocations(searchQuery: string) {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      // Nominatim API - completely free, no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=de,at,ch&limit=5&addressdetails=1`,
        {
          headers: {
            // Required by Nominatim usage policy
            "User-Agent": "Carcashflow/1.0",
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
    // Shorten the display name for better UX
    const shortName = shortenAddress(result.display_name)
    setQuery(shortName)
    setIsOpen(false)
    setResults([])
    onSelect({
      address: shortName,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    })
  }

  // Clear input
  function handleClear() {
    setQuery("")
    setResults([])
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
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
          onFocus={() => results.length > 0 && setIsOpen(true)}
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
      {isOpen && results.length > 0 && (
        <div className="absolute z-[100] mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-hover"
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
