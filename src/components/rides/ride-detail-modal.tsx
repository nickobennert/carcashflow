"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Car,
  Search,
  CircleDot,
} from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { ContactButton } from "@/components/rides/contact-button"
import { RouteMap } from "@/components/map"
import { cn } from "@/lib/utils"
import type { RideWithUser, MatchData, RoutePoint } from "@/types"

interface RideDetailModalProps {
  ride: RideWithUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId?: string
  matchData?: MatchData
}

export function RideDetailModal({
  ride,
  open,
  onOpenChange,
  currentUserId,
  matchData,
}: RideDetailModalProps) {
  if (!ride) return null

  const isOwnRide = currentUserId === ride.user_id
  const isOffer = ride.type === "offer"

  // Sort route points
  const sortedRoute = [...ride.route].sort((a, b) => a.order - b.order)
  const startPoint = sortedRoute.find((p) => p.type === "start") || sortedRoute[0]
  const endPoint =
    sortedRoute.find((p) => p.type === "end") || sortedRoute[sortedRoute.length - 1]
  const stops = sortedRoute.filter((p) => p.type === "stop")

  // Format date
  const departureDate = new Date(ride.departure_date)
  const formattedDate = format(departureDate, "EEEE, d. MMMM yyyy", { locale: de })

  // User info
  const displayName = ride.profiles.first_name
    ? `${ride.profiles.first_name} ${ride.profiles.last_name || ""}`.trim()
    : ride.profiles.username

  const initials = ride.profiles.first_name
    ? `${ride.profiles.first_name[0]}${ride.profiles.last_name?.[0] || ""}`
    : ride.profiles.username[0].toUpperCase()

  // Map points
  const mapPoints = sortedRoute
    .filter((p) => p.lat && p.lng)
    .map((p) => ({
      id: `${p.order}`,
      type: p.type,
      address: p.address,
      lat: p.lat!,
      lng: p.lng!,
      order: p.order,
    }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Accessible title for screen readers */}
        <DialogTitle className="sr-only">
          {extractCity(startPoint?.address)} → {extractCity(endPoint?.address)}
        </DialogTitle>

        {/* Type Badge Header */}
        <div
          className={cn(
            "px-6 py-4 flex items-center justify-between gap-3",
            isOffer ? "bg-offer/10" : "bg-request/10"
          )}
        >
          <Badge
            variant="secondary"
            className={cn(
              "gap-1.5 px-3 py-1 text-sm font-medium",
              isOffer
                ? "bg-offer text-white hover:bg-offer/90"
                : "bg-request text-white hover:bg-request/90"
            )}
          >
            {isOffer ? (
              <>
                <Car className="h-3.5 w-3.5" />
                Bietet Plätze an
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                Sucht Mitfahrt
              </>
            )}
          </Badge>

          {/* Match Badges */}
          {matchData?.onTheWay && (
            <div className="flex flex-wrap gap-1.5">
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
        </div>

        <div className="p-6 space-y-6">
          {/* Route Title */}
          <h2 className="text-xl font-bold tracking-tight">
            {extractCity(startPoint?.address)} → {extractCity(endPoint?.address)}
          </h2>

          {/* Route Timeline */}
          <ModalRouteTimeline
            startPoint={startPoint}
            stops={stops}
            endPoint={endPoint}
          />

          {/* Map */}
          {mapPoints.length >= 2 && (
            <div className="rounded-xl overflow-hidden">
              <RouteMap
                points={mapPoints}
                height="220px"
                routeGeometry={(ride as RideWithUser & { route_geometry?: [number, number][] | null }).route_geometry || undefined}
                showRouteInfo={!!(ride as RideWithUser & { route_geometry?: [number, number][] | null }).route_geometry}
              />
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 bg-muted/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Datum</span>
              </div>
              <p className="font-medium text-sm">{formattedDate}</p>
            </div>
            {ride.departure_time && (
              <div className="rounded-xl p-3 bg-muted/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Abfahrt</span>
                </div>
                <p className="font-medium text-sm">{ride.departure_time.slice(0, 5)} Uhr</p>
              </div>
            )}
            {isOffer && (
              <div className="rounded-xl p-3 bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Plätze</span>
                </div>
                <p className="font-medium text-sm text-primary">{ride.seats_available || 1}</p>
              </div>
            )}
          </div>

          {/* Comment */}
          {ride.comment && (
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                Kommentar
              </p>
              <p className="text-sm leading-relaxed break-words">{ride.comment}</p>
            </div>
          )}

          {/* User Card */}
          <div className="flex items-center gap-3 p-4 rounded-xl border">
            <Link
              href={`/u/${ride.profiles.username}`}
              target="_blank"
              className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm shrink-0">
                <AvatarImage src={ride.profiles.avatar_url || undefined} />
                <AvatarFallback className="text-sm font-semibold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold truncate hover:underline">{displayName}</p>
                {ride.profiles.city && (
                  <p className="text-sm text-muted-foreground">aus {ride.profiles.city}</p>
                )}
              </div>
            </Link>
          </div>

          {/* Action */}
          {!isOwnRide && (
            <ContactButton
              otherUserId={ride.user_id}
              rideId={ride.id}
              isOffer={isOffer}
            />
          )}
          {isOwnRide && (
            <p className="text-sm text-muted-foreground text-center">
              Dies ist deine eigene Route
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Simplified route timeline for modal
function ModalRouteTimeline({
  startPoint,
  stops,
  endPoint,
}: {
  startPoint: RoutePoint | undefined
  stops: RoutePoint[]
  endPoint: RoutePoint | undefined
}) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-offer via-muted-foreground/30 to-request" />

      <div className="space-y-4">
        {/* Start */}
        {startPoint && (
          <div className="flex items-start gap-3">
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-offer text-white shadow-sm shrink-0">
              <CircleDot className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-medium text-offer uppercase tracking-wider">Start</p>
              <p className="font-semibold truncate">{extractCity(startPoint.address)}</p>
              <p className="text-xs text-muted-foreground truncate">{startPoint.address}</p>
            </div>
          </div>
        )}

        {/* Stops */}
        {stops.map((stop, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted-foreground/20 border-2 border-muted-foreground/40 shrink-0">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Zwischenstopp</p>
              <p className="font-medium text-sm truncate">{extractCity(stop.address)}</p>
              <p className="text-xs text-muted-foreground truncate">{stop.address}</p>
            </div>
          </div>
        ))}

        {/* End */}
        {endPoint && (
          <div className="flex items-start gap-3">
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-request text-white shadow-sm shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-medium text-request uppercase tracking-wider">Ziel</p>
              <p className="font-semibold truncate">{extractCity(endPoint.address)}</p>
              <p className="text-xs text-muted-foreground truncate">{endPoint.address}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function extractCity(address?: string): string {
  if (!address) return "Unbekannt"
  const parts = address.split(",")
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 2]?.trim()
    const withoutPostal = cityPart?.replace(/^\d{5}\s*/, "")
    return withoutPostal || parts[0]?.trim() || "Unbekannt"
  }
  return parts[0]?.trim() || "Unbekannt"
}
