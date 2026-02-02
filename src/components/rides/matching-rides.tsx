"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles, MapPin, ChevronRight, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { formatDistance } from "@/lib/location-storage"
import type { RideWithUser, RoutePoint } from "@/types"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface MatchingRide extends RideWithUser {
  similarity?: number
  onTheWay?: boolean
  matchTier?: "direct" | "small_detour" | "detour" | "none"
  matchDetails?: string[]
  minDistance?: number | null
  distance?: number
}

interface MatchingRidesProps {
  route: RoutePoint[]
  type: "offer" | "request"
  departureDate?: Date
  routeGeometry?: [number, number][]
  onClose?: () => void
  onShowAllInFeed?: () => void
}

export function MatchingRides({
  route,
  type,
  departureDate,
  routeGeometry,
  onClose,
  onShowAllInFeed,
}: MatchingRidesProps) {
  const router = useRouter()
  const [rides, setRides] = useState<MatchingRide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create stable keys from route and date to prevent infinite loops
  const routeKey = useMemo(() => {
    return route.map(p => `${p.type}:${p.lat}:${p.lng}`).join("|")
  }, [route])

  const departureDateKey = departureDate?.toISOString().split("T")[0] || ""

  // Store route in ref to use current value in effect without causing re-runs
  const routeRef = useRef(route)
  routeRef.current = route

  useEffect(() => {
    async function fetchMatches() {
      const currentRoute = routeRef.current
      // Only search if we have valid start and end
      const start = currentRoute.find((p) => p.type === "start")
      const end = currentRoute.find((p) => p.type === "end")

      if (!start?.lat || !end?.lat) {
        setRides([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/rides/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            route: currentRoute,
            type,
            departure_date: departureDate?.toISOString().split("T")[0],
            ...(routeGeometry && routeGeometry.length >= 2 ? { route_geometry: routeGeometry } : {}),
          }),
        })

        if (!response.ok) throw new Error("Failed to fetch matches")

        const data = await response.json()
        setRides(data.data || [])
      } catch (err) {
        console.error("Error fetching matches:", err)
        setError("Fehler beim Laden")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatches()
  }, [routeKey, type, departureDateKey])

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-2">Suche passende Fahrten...</p>
      </div>
    )
  }

  if (error) {
    return null
  }

  if (rides.length === 0) {
    return null
  }

  return (
    <Card className="border-offer/30 bg-offer/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-offer" />
            <span className="text-sm font-medium">
              {rides.length} passende {type === "offer" ? "Gesuche" : "Angebote"} gefunden
            </span>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-2"
        >
          <AnimatePresence>
            {rides.slice(0, 3).map((ride) => (
              <motion.div key={ride.id} variants={staggerItem}>
                <div
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/80 transition-colors cursor-pointer"
                  onClick={() => {
                    // Close drawer first, then navigate to the ride
                    onShowAllInFeed?.()
                    router.push(`/dashboard?ride=${ride.id}`)
                  }}
                >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={ride.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {ride.profiles?.first_name?.[0] || ride.profiles?.username?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {ride.profiles?.first_name || ride.profiles?.username}
                        </span>
                        {ride.similarity && ride.similarity >= 70 && (
                          <Badge variant="secondary" className="text-xs bg-offer/20 text-offer">
                            {ride.similarity}% Match
                          </Badge>
                        )}
                        {ride.onTheWay && ride.matchTier === "direct" && (
                          <Badge variant="secondary" className="text-xs bg-offer/20 text-offer">
                            Auf der Route
                          </Badge>
                        )}
                        {ride.onTheWay && ride.matchTier === "small_detour" && (
                          <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                            {ride.minDistance} km Umweg
                          </Badge>
                        )}
                        {ride.onTheWay && ride.matchTier === "detour" && (
                          <Badge variant="secondary" className="text-xs">
                            {ride.minDistance} km Umweg
                          </Badge>
                        )}
                        {ride.onTheWay && !ride.matchTier && (
                          <Badge variant="secondary" className="text-xs">
                            Unterwegs
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {ride.route.find((p) => p.type === "start")?.address?.split(",")[0]}
                          {" → "}
                          {ride.route.find((p) => p.type === "end")?.address?.split(",")[0]}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-medium">
                        {format(new Date(ride.departure_date), "EEE, d. MMM", { locale: de })}
                      </div>
                      {ride.distance && (
                        <div className="text-xs text-muted-foreground">
                          {formatDistance(ride.distance)} entfernt
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs mt-1"
            onClick={() => {
              const start = route.find(p => p.type === "start")
              const end = route.find(p => p.type === "end")
              const params = new URLSearchParams()
              if (start?.lat && start?.lng) {
                params.set("match_start_lat", String(start.lat))
                params.set("match_start_lng", String(start.lng))
              }
              if (end?.lat && end?.lng) {
                params.set("match_end_lat", String(end.lat))
                params.set("match_end_lng", String(end.lng))
              }
              if (departureDate) {
                params.set("match_date", departureDate.toISOString().split("T")[0])
              }
              params.set("match_type", type)
              // Close drawer first, then navigate
              onShowAllInFeed?.()
              router.push(`/dashboard?${params.toString()}`)
            }}
          >
            Alle {rides.length} Ergebnisse im Dashboard anzeigen
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  )
}
