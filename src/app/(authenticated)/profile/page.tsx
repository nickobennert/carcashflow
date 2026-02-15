"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  MapPin,
  Calendar,
  Car,
  Settings,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations"
import type { Profile } from "@/types"

interface RideWithProfile {
  id: string
  type: string
  start_location: string
  end_location: string
  departure_date: string
  status: string
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [rides, setRides] = useState<RideWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const today = new Date().toISOString().split("T")[0]

      // Start both queries simultaneously, await separately
      const profileQuery = supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      const ridesQuery = supabase
        .from("rides")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("departure_date", today)
        .order("departure_date", { ascending: true })
        .limit(5)

      // Both queries are already in flight, awaiting them "collects" results
      const { data: profileData } = await profileQuery
      const { data: ridesData } = await ridesQuery

      if (profileData) {
        setProfile(profileData as Profile)
      }

      if (ridesData) {
        setRides(ridesData as RideWithProfile[])
      }

      setIsLoading(false)
    }

    loadData()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="w-full">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-28" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const initials = profile.first_name
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ""}`
    : profile.username?.[0]?.toUpperCase() || "?"

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="w-full"
    >
      {/* Header Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {profile.first_name} {profile.last_name}
                </h1>
              </div>

              <p className="text-muted-foreground mb-3">@{profile.username}</p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Mitglied seit{" "}
                  {format(new Date(profile.created_at), "MMMM yyyy", {
                    locale: de,
                  })}
                </span>
              </div>
            </div>

            <Button variant="outline" onClick={() => router.push("/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-offer">
              {rides.filter((r) => r.type === "offer").length}
            </p>
            <p className="text-sm text-muted-foreground">Angebote</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-request">
              {rides.filter((r) => r.type === "request").length}
            </p>
            <p className="text-sm text-muted-foreground">Gesuche</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-primary">
              {format(new Date(profile.created_at), "MMM yyyy", { locale: de })}
            </p>
            <p className="text-sm text-muted-foreground">Mitglied seit</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rides */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive Fahrten</CardTitle>
          <CardDescription>Deine aktuellen Angebote und Gesuche</CardDescription>
        </CardHeader>
        <CardContent>
          {rides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Noch keine Fahrten eingestellt</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => router.push("/dashboard")}
              >
                Erste Fahrt erstellen
              </Button>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              {rides.map((ride) => (
                <motion.div
                  key={ride.id}
                  variants={staggerItem}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/rides/${ride.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={
                        ride.type === "offer"
                          ? "bg-offer/10 text-offer"
                          : "bg-request/10 text-request"
                      }
                    >
                      {ride.type === "offer" ? "Biete" : "Suche"}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {ride.start_location} → {ride.end_location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(ride.departure_date), "d. MMMM yyyy", {
                          locale: de,
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={ride.status === "active" ? "default" : "secondary"}
                  >
                    {ride.status === "active" ? "Aktiv" : ride.status}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
