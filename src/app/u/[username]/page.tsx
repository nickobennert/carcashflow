import { notFound } from "next/navigation"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { MapPin, Calendar, Car, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PublicProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profileData } = await supabase
    .from("profiles")
    .select("first_name, last_name, username")
    .eq("username", username)
    .eq("is_public", true)
    .single()

  const profile = profileData as { first_name: string; last_name: string | null; username: string } | null

  if (!profile) {
    return { title: "Profil nicht gefunden" }
  }

  return {
    title: `${profile.first_name} ${profile.last_name || ""} (@${profile.username})`,
    description: `Profil von ${profile.first_name} auf Carcashflow`,
  }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Check if profile exists
  const { data: profileCheckData } = await supabase
    .from("profiles")
    .select("id, is_public")
    .eq("username", username)
    .single()

  const profileCheck = profileCheckData as { id: string; is_public: boolean } | null

  if (!profileCheck) {
    notFound()
  }

  // If profile is private, show private message
  if (!profileCheck.is_public) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-xl font-semibold mb-2">Privates Profil</h1>
            <p className="text-muted-foreground">
              Dieses Profil ist nicht öffentlich sichtbar.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch full profile and rides
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("is_public", true)
    .single()

  const { data: ridesData } = await supabase
    .from("rides")
    .select("*")
    .eq("user_id", profileCheck.id)
    .eq("status", "active")
    .order("departure_date", { ascending: true })
    .limit(10)

  const profile = profileData as {
    id: string
    username: string
    first_name: string
    last_name: string | null
    avatar_url: string | null
    bio: string | null
    city: string | null
    created_at: string
  } | null

  const rides = (ridesData || []) as {
    id: string
    type: string
    start_location: string
    end_location: string
    departure_date: string
    seats_available: number | null
    status: string
  }[]

  if (!profile) {
    notFound()
  }

  const initials = profile.first_name
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ""}`
    : profile.username?.[0]?.toUpperCase() || "?"

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 py-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <Avatar className="h-28 w-28">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-3xl font-semibold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">
                  {profile.first_name} {profile.last_name}
                </h1>
                <p className="text-muted-foreground mb-4">@{profile.username}</p>

                {profile.bio && (
                  <p className="text-muted-foreground mb-4 max-w-lg">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
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
            </div>
          </CardContent>
        </Card>

        {/* Active Rides */}
        <Card>
          <CardHeader>
            <CardTitle>Aktive Fahrten</CardTitle>
            <CardDescription>
              Aktuelle Angebote und Gesuche von {profile.first_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Keine aktiven Fahrten</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rides.map((ride) => (
                  <div
                    key={ride.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
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
                    {ride.seats_available && (
                      <Badge variant="outline">
                        {ride.seats_available} {ride.seats_available === 1 ? "Platz" : "Plätze"}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Mitglied von <span className="font-semibold">Carcashflow</span>
        </p>
      </div>
    </div>
  )
}
