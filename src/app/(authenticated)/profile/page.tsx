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
  Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      const { data: ridesData } = await supabase
        .from("rides")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

              {profile.bio && (
                <p className="text-sm text-muted-foreground mb-4 max-w-lg">
                  {profile.bio}
                </p>
              )}

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
            <p className="text-2xl font-bold text-green-600">
              {rides.filter((r) => r.type === "offer").length}
            </p>
            <p className="text-sm text-muted-foreground">Angebote</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-blue-600">
              {rides.filter((r) => r.type === "request").length}
            </p>
            <p className="text-sm text-muted-foreground">Gesuche</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-purple-600">
              {format(new Date(profile.created_at), "MMM yyyy", { locale: de })}
            </p>
            <p className="text-sm text-muted-foreground">Mitglied seit</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rides */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Aktivitäten</CardTitle>
          <CardDescription>Deine letzten Fahrten und Gesuche</CardDescription>
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
                          ? "bg-green-500/10 text-green-600"
                          : "bg-blue-500/10 text-blue-600"
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
