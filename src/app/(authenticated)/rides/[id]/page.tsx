"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowLeft,
  Car,
  Search,
  CircleDot,
  MoreHorizontal,
  Pencil,
  Trash2,
  Share2,
  Flag,
} from "lucide-react"
import Link from "next/link"
import { motion } from "motion/react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { RouteMap } from "@/components/map"
import { ContactButton } from "@/components/rides/contact-button"
import { cn } from "@/lib/utils"
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations"
import type { RideWithUser, RoutePoint } from "@/types"

interface RideDetailPageProps {
  params: Promise<{ id: string }>
}

export default function RideDetailPage({ params }: RideDetailPageProps) {
  const router = useRouter()
  const [ride, setRide] = useState<RideWithUser | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { id } = await params

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setCurrentUserId(user.id)

      const { data: rideData } = (await supabase
        .from("rides")
        .select(
          `
          *,
          profiles:user_id (
            id,
            username,
            first_name,
            last_name,
            avatar_url,
            city,
            bio
          )
        `
        )
        .eq("id", id)
        .single()) as { data: RideWithUser | null }

      if (!rideData) {
        router.push("/dashboard")
        return
      }

      setRide(rideData)
      setIsLoading(false)
    }

    loadData()
  }, [params, router, supabase])

  if (isLoading || !ride || !currentUserId) {
    return <RideDetailSkeleton />
  }

  const isOwnRide = ride.user_id === currentUserId
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
  const shortDate = format(departureDate, "dd.MM.yyyy")

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
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Button>

        {isOwnRide && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/rides/${ride.id}/edit`} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Bearbeiten
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Share2 className="h-4 w-4" />
                Teilen
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Main Card */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate">
        <Card className="overflow-hidden border-0 shadow-lg">
          {/* Type Badge Header */}
          <div
            className={cn(
              "px-6 py-4",
              isOffer ? "bg-emerald-500/10" : "bg-blue-500/10"
            )}
          >
            <Badge
              variant="secondary"
              className={cn(
                "gap-1.5 px-3 py-1 text-sm font-medium",
                isOffer
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
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
          </div>

          <CardContent className="p-6 space-y-8">
            {/* Route Title */}
            <motion.div variants={staggerItem}>
              <h1 className="text-2xl font-bold tracking-tight">
                {extractCity(startPoint?.address)} → {extractCity(endPoint?.address)}
              </h1>
            </motion.div>

            {/* Route Timeline */}
            <motion.div variants={staggerItem} className="space-y-0">
              <RouteTimeline
                startPoint={startPoint}
                stops={stops}
                endPoint={endPoint}
                isOffer={isOffer}
              />
            </motion.div>

            {/* Map */}
            {mapPoints.length >= 2 && (
              <motion.div variants={staggerItem} className="rounded-xl overflow-hidden">
                <RouteMap points={mapPoints} height="280px" />
              </motion.div>
            )}

            {/* Info Grid */}
            <motion.div
              variants={staggerItem}
              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
            >
              <InfoCard
                icon={Calendar}
                label="Datum"
                value={formattedDate}
                subValue={shortDate}
              />
              {ride.departure_time && (
                <InfoCard
                  icon={Clock}
                  label="Abfahrt"
                  value={`${ride.departure_time.slice(0, 5)} Uhr`}
                />
              )}
              {isOffer && (
                <InfoCard
                  icon={Users}
                  label="Freie Plätze"
                  value={ride.seats_available?.toString() || "1"}
                  highlight
                />
              )}
            </motion.div>

            {/* Comment */}
            {ride.comment && (
              <motion.div
                variants={staggerItem}
                className="bg-muted/50 rounded-xl p-4"
              >
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Kommentar
                </p>
                <p className="text-sm leading-relaxed">{ride.comment}</p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Provider Card */}
        <motion.div variants={staggerItem} className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/u/${ride.profiles.username}`}
                  target="_blank"
                  className="flex items-center gap-4 group flex-1 min-w-0"
                >
                  <Avatar className="h-14 w-14 ring-2 ring-background shadow-md">
                    <AvatarImage src={ride.profiles.avatar_url || undefined} />
                    <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                      {displayName}
                    </p>
                    {ride.profiles.city && (
                      <p className="text-sm text-muted-foreground">
                        aus {ride.profiles.city}
                      </p>
                    )}
                  </div>
                </Link>

                {!isOwnRide && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/u/${ride.profiles.username}`} target="_blank" className="gap-2">
                          Profil anzeigen
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                        <Flag className="h-4 w-4" />
                        Melden
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {ride.profiles.bio && (
                <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                  {ride.profiles.bio}
                </p>
              )}

              {/* Action Button */}
              <div className="mt-6 pt-6 border-t">
                {isOwnRide ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Dies ist deine eigene Route
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/rides/${ride.id}/edit`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <ContactButton
                      otherUserId={ride.user_id}
                      rideId={ride.id}
                      isOffer={isOffer}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Kontaktdaten werden erst nach beiderseitiger Zustimmung geteilt.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function RouteTimeline({
  startPoint,
  stops,
  endPoint,
  isOffer,
}: {
  startPoint: RoutePoint | undefined
  stops: RoutePoint[]
  endPoint: RoutePoint | undefined
  isOffer: boolean
}) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-500 via-muted-foreground/30 to-blue-500" />

      <div className="space-y-6">
        {/* Start */}
        {startPoint && (
          <div className="flex items-start gap-4">
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
              <CircleDot className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Start
              </p>
              <p className="font-semibold text-lg">{extractCity(startPoint.address)}</p>
              <p className="text-sm text-muted-foreground truncate">
                {startPoint.address}
              </p>
            </div>
          </div>
        )}

        {/* Stops */}
        {stops.map((stop, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted-foreground/20 border-2 border-muted-foreground/40">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Zwischenstopp
              </p>
              <p className="font-medium">{extractCity(stop.address)}</p>
              <p className="text-sm text-muted-foreground truncate">{stop.address}</p>
            </div>
          </div>
        ))}

        {/* End */}
        {endPoint && (
          <div className="flex items-start gap-4">
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-md">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Ziel
              </p>
              <p className="font-semibold text-lg">{extractCity(endPoint.address)}</p>
              <p className="text-sm text-muted-foreground truncate">
                {endPoint.address}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
  subValue,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subValue?: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-4 transition-colors",
        highlight ? "bg-primary/5 border border-primary/20" : "bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon
          className={cn(
            "h-4 w-4",
            highlight ? "text-primary" : "text-muted-foreground"
          )}
        />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={cn("font-semibold", highlight && "text-primary")}>{value}</p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
      )}
    </div>
  )
}

function RideDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <Skeleton className="h-9 w-24 mb-6" />
      <Card className="overflow-hidden border-0 shadow-lg">
        <Skeleton className="h-16 w-full" />
        <div className="p-6 space-y-8">
          <Skeleton className="h-8 w-3/4" />
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </Card>
      <Card className="mt-6 border-0 shadow-lg">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-11 w-full mt-6" />
        </div>
      </Card>
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
