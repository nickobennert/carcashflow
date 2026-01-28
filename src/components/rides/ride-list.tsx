"use client"

import { useState, useEffect } from "react"
import { Car, Sparkles, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RideCard } from "./ride-card"
import type { RideWithUser, MatchData } from "@/types"
import type { MatchParams } from "@/app/(authenticated)/dashboard/page"

interface MatchedRide extends RideWithUser {
  similarity?: number
  onTheWay?: boolean
  matchTier?: "direct" | "small_detour" | "detour" | "none"
  matchDetails?: string[]
  minDistance?: number | null
  distance?: number
}

interface RideListProps {
  rides: RideWithUser[]
  currentUserId?: string
  emptyMessage?: string
  matchParams?: MatchParams
}

export function RideList({ rides, currentUserId, emptyMessage, matchParams }: RideListProps) {
  const [matchedRides, setMatchedRides] = useState<MatchedRide[] | null>(null)
  const [isLoadingMatches, setIsLoadingMatches] = useState(false)

  // Fetch matching rides when matchParams are present
  useEffect(() => {
    if (!matchParams) {
      setMatchedRides(null)
      return
    }

    async function fetchMatches() {
      setIsLoadingMatches(true)
      try {
        // Route-based matching (two points)
        if (matchParams!.match_start_lat && matchParams!.match_start_lng) {
          const route = [
            {
              type: "start" as const,
              address: "",
              lat: parseFloat(matchParams!.match_start_lat!),
              lng: parseFloat(matchParams!.match_start_lng!),
              order: 0,
            },
            ...(matchParams!.match_end_lat && matchParams!.match_end_lng
              ? [{
                  type: "end" as const,
                  address: "",
                  lat: parseFloat(matchParams!.match_end_lat!),
                  lng: parseFloat(matchParams!.match_end_lng!),
                  order: 1,
                }]
              : []),
          ]

          const response = await fetch("/api/rides/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              route,
              type: matchParams!.match_type || "offer",
              departure_date: matchParams!.match_date,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setMatchedRides(data.data || [])
          }
        }
        // Single-point proximity matching
        else if (matchParams!.nearby_lat && matchParams!.nearby_lng) {
          const params = new URLSearchParams({
            lat: matchParams!.nearby_lat!,
            lng: matchParams!.nearby_lng!,
            radius: matchParams!.nearby_radius || "30",
          })

          const response = await fetch(`/api/rides/match?${params.toString()}`)
          if (response.ok) {
            const data = await response.json()
            setMatchedRides(data.data || [])
          }
        }
      } catch (err) {
        console.error("Error fetching matches:", err)
        setMatchedRides(null)
      } finally {
        setIsLoadingMatches(false)
      }
    }

    fetchMatches()
  }, [matchParams])

  // Loading state for match mode
  if (matchParams && isLoadingMatches) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Suche passende Routen...</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Match mode active: show matched rides
  if (matchParams && matchedRides !== null) {
    if (matchedRides.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Car className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Keine passenden Routen gefunden</p>
            <p className="text-sm text-muted-foreground mt-1">Versuche andere Start- oder Zielorte</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-offer" />
          <span className="text-sm font-medium">
            {matchedRides.length} passende {matchedRides.length === 1 ? "Route" : "Routen"} gefunden
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {matchedRides.map((ride) => {
            const matchData: MatchData = {
              similarity: ride.similarity,
              onTheWay: ride.onTheWay,
              matchTier: ride.matchTier,
              minDistance: ride.minDistance,
              matchDetails: ride.matchDetails,
              distance: ride.distance,
            }
            return (
              <RideCard
                key={ride.id}
                ride={ride}
                currentUserId={currentUserId}
                matchData={matchData}
              />
            )
          })}
        </div>
      </div>
    )
  }

  // Default mode: show server-loaded rides
  if (rides.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Car className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{emptyMessage || "Keine Routen gefunden"}</p>
          <p className="text-sm text-muted-foreground mt-1">Versuche andere Filteroptionen</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rides.map((ride) => (
        <RideCard key={ride.id} ride={ride} currentUserId={currentUserId} />
      ))}
    </div>
  )
}
