"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Calendar, Users, Clock, MessageSquare, Pencil } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditRideDrawer } from "@/components/rides/edit-ride-drawer"
import { cn } from "@/lib/utils"
import type { RideWithUser, MatchData } from "@/types"

interface RideCardProps {
  ride: RideWithUser
  currentUserId?: string
  matchData?: MatchData
  onOpenDetail?: (ride: RideWithUser) => void
}

export function RideCard({ ride, currentUserId, matchData, onOpenDetail }: RideCardProps) {
  const isOwnRide = currentUserId === ride.user_id
  const isOffer = ride.type === "offer"

  // Get start and end points from route
  const sortedRoute = [...ride.route].sort((a, b) => a.order - b.order)
  const startPoint = sortedRoute.find((p) => p.type === "start") || sortedRoute[0]
  const endPoint = sortedRoute.find((p) => p.type === "end") || sortedRoute[sortedRoute.length - 1]
  const stopCount = sortedRoute.filter((p) => p.type === "stop").length

  // Format date
  const departureDate = new Date(ride.departure_date)
  const formattedDate = format(departureDate, "EEE, d. MMM", { locale: de })

  // Get initials for avatar fallback
  const initials = ride.profiles.first_name
    ? `${ride.profiles.first_name[0]}${ride.profiles.last_name?.[0] || ""}`
    : ride.profiles.username[0].toUpperCase()

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover:bg-muted/30 hover:-translate-y-0.5">
      {/* Match indicator line */}
      {matchData?.onTheWay && (
        <div
          className={cn(
            "absolute left-0 top-[10%] bottom-[10%] w-[3px] rounded-full z-10",
            matchData.matchTier === "direct" && "bg-offer",
            matchData.matchTier === "small_detour" && "bg-yellow-500",
            matchData.matchTier === "detour" && "bg-muted-foreground",
          )}
        />
      )}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <Link
              href={`/u/${ride.profiles.username}`}
              target="_blank"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={ride.profiles.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium leading-none hover:underline">
                  {ride.profiles.first_name} {ride.profiles.last_name?.[0]}.
                </p>
                {ride.profiles.city && (
                  <p className="text-xs text-muted-foreground mt-1">
                    aus {ride.profiles.city}
                  </p>
                )}
              </div>
            </Link>
            <Badge
              variant="secondary"
              className={cn(
                isOffer
                  ? "bg-offer/10 text-offer hover:bg-offer/20"
                  : "bg-request/10 text-request hover:bg-request/20"
              )}
            >
              {isOffer ? "Bietet Plätze" : "Sucht Mitfahrt"}
            </Badge>
          </div>
        </CardHeader>

        {/* Match Badges */}
        {matchData?.onTheWay && (
          <div className="px-6 pb-1 flex flex-wrap gap-1.5">
            {matchData.matchTier === "direct" && (
              <Badge variant="secondary" className="text-xs bg-offer/15 text-offer border-offer/30">
                Auf der Route
              </Badge>
            )}
            {matchData.matchTier === "small_detour" && (
              <Badge variant="secondary" className="text-xs bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                {matchData.minDistance ? `${Math.round(matchData.minDistance)} km Umweg` : "Kleiner Umweg"}
              </Badge>
            )}
            {matchData.matchTier === "detour" && (
              <Badge variant="secondary" className="text-xs">
                {matchData.minDistance ? `${Math.round(matchData.minDistance)} km Umweg` : "Umweg"}
              </Badge>
            )}
            {matchData.similarity != null && matchData.similarity >= 70 && (
              <Badge variant="secondary" className="text-xs bg-offer/15 text-offer border-offer/30">
                {matchData.similarity}% Match
              </Badge>
            )}
          </div>
        )}

        <CardContent className="space-y-3">
          {/* Route */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-offer" />
                <div className="w-0.5 h-6 bg-border" />
                {stopCount > 0 && (
                  <>
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <div className="w-0.5 h-6 bg-border" />
                  </>
                )}
                <div className="h-2.5 w-2.5 rounded-full bg-request" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-sm font-medium leading-tight">
                    {extractCity(startPoint?.address)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {startPoint?.address}
                  </p>
                </div>
                {stopCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    + {stopCount} Zwischenstopp{stopCount > 1 ? "s" : ""}
                  </p>
                )}
                <div>
                  <p className="text-sm font-medium leading-tight">
                    {extractCity(endPoint?.address)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {endPoint?.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
            {ride.departure_time && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{ride.departure_time.slice(0, 5)} Uhr</span>
              </div>
            )}
            {isOffer && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{ride.seats_available} Plätze frei</span>
              </div>
            )}
          </div>

          {/* Comment preview */}
          {ride.comment && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              &ldquo;{ride.comment}&rdquo;
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          {isOwnRide ? (
            <EditRideDrawer
              ride={{
                id: ride.id,
                type: ride.type,
                route: ride.route.map((p) => ({
                  type: p.type,
                  address: p.address,
                  lat: p.lat ?? 0,
                  lng: p.lng ?? 0,
                  order: p.order,
                })),
                departure_date: ride.departure_date,
                departure_time: ride.departure_time,
                seats_available: ride.seats_available,
                comment: ride.comment,
              }}
              trigger={
                <Button variant="outline" size="sm" className="w-full">
                  <Pencil className="mr-2 h-4 w-4" />
                  Bearbeiten
                </Button>
              }
            />
          ) : (
            <Button
              size="sm"
              className={cn(
                "w-full",
                isOffer
                  ? "bg-offer hover:bg-offer/90"
                  : "bg-request hover:bg-request/90"
              )}
              onClick={() => onOpenDetail?.(ride)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Kontakt aufnehmen
            </Button>
          )}
        </CardFooter>
    </Card>
  )
}

// Helper to extract city from full address
function extractCity(address?: string): string {
  if (!address) return "Unbekannt"
  const parts = address.split(",")
  // Usually city is the second-to-last part before country
  if (parts.length >= 2) {
    // Check if it contains postal code
    const cityPart = parts[parts.length - 2]?.trim()
    // Remove postal code if present (5 digit number at start)
    const withoutPostal = cityPart?.replace(/^\d{5}\s*/, "")
    return withoutPostal || parts[0]?.trim() || "Unbekannt"
  }
  return parts[0]?.trim() || "Unbekannt"
}
