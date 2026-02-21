"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Car,
  ThumbsUp,
  CircleDot,
  User,
  Flag,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ContactButton } from "@/components/rides/contact-button"
import { ReportDialog } from "@/components/reports/report-dialog"
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
  const formattedDate = format(departureDate, "EEE, d. MMMM yyyy", { locale: de })

  // Safe profile access (profile might be null if user was deleted or not created)
  const profile = ride.profiles || { username: "Unbekannt", first_name: null, last_name: null, avatar_url: null, city: null }

  // User info
  const displayName = profile.first_name
    ? `${profile.first_name} ${profile.last_name?.[0] || ""}.`.trim()
    : profile.username

  const initials = profile.first_name
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ""}`
    : (profile.username?.[0] || "U").toUpperCase()

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
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto p-0 gap-0 rounded-xl sm:rounded-2xl">
        {/* Accessible title for screen readers */}
        <DialogTitle className="sr-only">
          {extractCity(startPoint?.address)} → {extractCity(endPoint?.address)}
        </DialogTitle>

        {/* Header: Type + Match Badges - with safe padding for close button */}
        <div className="px-5 pt-5 pr-12 pb-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={cn(
                "gap-1.5 px-2.5 py-0.5 text-xs font-medium",
                isOffer
                  ? "bg-offer/15 text-offer border-offer/30"
                  : "bg-request/15 text-request border-request/30"
              )}
            >
              {isOffer ? (
                <>
                  <Car className="h-3 w-3" />
                  Bietet Plätze
                </>
              ) : (
                <>
                  <ThumbsUp className="h-3 w-3" />
                  Sucht Mitfahrt
                </>
              )}
            </Badge>

            {/* Match Badges */}
            {matchData?.onTheWay && (
              <>
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
              </>
            )}
          </div>

          {/* Route Title */}
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {extractCity(startPoint?.address)} → {extractCity(endPoint?.address)}
          </h2>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Route Timeline */}
          <ModalRouteTimeline
            startPoint={startPoint}
            stops={stops}
            endPoint={endPoint}
          />

          {/* Map */}
          {mapPoints.length >= 2 && (
            <div className="rounded-lg overflow-hidden -mx-1">
              <RouteMap
                points={mapPoints}
                height="180px"
                routeGeometry={(ride as RideWithUser & { route_geometry?: [number, number][] | null }).route_geometry || undefined}
                showRouteInfo={!!(ride as RideWithUser & { route_geometry?: [number, number][] | null }).route_geometry}
              />
            </div>
          )}

          {/* Info Row - inline */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            {ride.departure_time && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{ride.departure_time.slice(0, 5)} Uhr</span>
              </div>
            )}
            {isOffer && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{ride.seats_available || 1} Plätze frei</span>
              </div>
            )}
          </div>

          {/* Comment */}
          {ride.comment && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm leading-relaxed break-words text-muted-foreground italic">
                &ldquo;{ride.comment}&rdquo;
              </p>
            </div>
          )}

          <Separator />

          {/* User - dezent, kein Link */}
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{displayName}</p>
              {profile.city && (
                <p className="text-xs text-muted-foreground">aus {profile.city}</p>
              )}
            </div>
            <User className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          </div>

          {/* Action */}
          {!isOwnRide && (
            <div className="space-y-2">
              <ContactButton
                otherUserId={ride.user_id}
                rideId={ride.id}
                isOffer={isOffer}
              />
              <div className="flex justify-center">
                <ReportDialog
                  targetType="ride"
                  targetId={ride.id}
                  targetName={`${extractCity(startPoint?.address)} → ${extractCity(endPoint?.address)}`}
                  trigger={
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
                      <Flag className="h-3 w-3" />
                      Route melden
                    </button>
                  }
                />
              </div>
            </div>
          )}
          {isOwnRide && (
            <p className="text-sm text-muted-foreground text-center py-1">
              Dies ist deine eigene Route
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Compact route timeline for modal
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
      <div className="absolute left-[11px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-offer via-muted-foreground/30 to-request" />

      <div className="space-y-3">
        {/* Start */}
        {startPoint && (
          <div className="flex items-start gap-2.5">
            <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-offer text-white shadow-sm shrink-0">
              <CircleDot className="h-3 w-3" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="font-semibold text-sm truncate">{extractCity(startPoint.address)}</p>
              <p className="text-xs text-muted-foreground truncate">{startPoint.address}</p>
            </div>
          </div>
        )}

        {/* Stops */}
        {stops.map((stop, index) => (
          <div key={index} className="flex items-start gap-2.5">
            <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-muted-foreground/20 border border-muted-foreground/40 shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="font-medium text-sm truncate">{extractCity(stop.address)}</p>
              <p className="text-xs text-muted-foreground truncate">{stop.address}</p>
            </div>
          </div>
        ))}

        {/* End */}
        {endPoint && (
          <div className="flex items-start gap-2.5">
            <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-request text-white shadow-sm shrink-0">
              <MapPin className="h-3 w-3" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="font-semibold text-sm truncate">{extractCity(endPoint.address)}</p>
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
