import { Suspense } from "react"
import { Metadata } from "next"
import { Plus, Car, Search, AlertTriangle, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { RideList, RideFilters, CreateRideDialog } from "@/components/rides"
import type { RideWithUser } from "@/types"

export const metadata: Metadata = {
  title: "Rückfahrten",
  description: "Finde Mitfahrgelegenheiten für deine Rückfahrt nach der Fahrzeugüberführung",
}

interface DashboardPageProps {
  searchParams: Promise<{
    type?: string
    search?: string
    date?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Build query for rides
  let query = supabase
    .from("rides")
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        first_name,
        last_name,
        avatar_url,
        city
      )
    `)
    .eq("status", "active")
    .gte("departure_date", new Date().toISOString().split("T")[0])
    .order("departure_date", { ascending: true })

  // Apply filters
  if (params.type && params.type !== "all") {
    query = query.eq("type", params.type)
  }

  if (params.date) {
    query = query.eq("departure_date", params.date)
  }

  // Execute query
  const { data: ridesData } = await query as { data: RideWithUser[] | null }

  // Type assertion for the joined data
  const rides = (ridesData || []) as RideWithUser[]

  // Filter by search term if provided (client-side for address search in JSONB)
  const filteredRides = params.search
    ? rides.filter((ride) => {
        const searchLower = params.search!.toLowerCase()
        return ride.route.some((point) =>
          point.address.toLowerCase().includes(searchLower)
        )
      })
    : rides

  // Get counts
  const offerCount = rides.filter((r) => r.type === "offer").length
  const requestCount = rides.filter((r) => r.type === "request").length
  const userRideCount = user
    ? rides.filter((r) => r.user_id === user.id).length
    : 0

  return (
    <div className="space-y-6">
      {/* Legal Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Diese Plattform dient der Kontaktanbahnung für Rückfahrten nach Fahrzeugüberführungen.
          Es findet keine Vermittlung oder Haftung statt. Alle Absprachen erfolgen eigenverantwortlich.
        </AlertDescription>
      </Alert>

      {/* Page Header */}
      <PageHeader
        title="Rückfahrten"
        description="Finde Mitfahrgelegenheiten nach deiner Fahrzeugüberführung"
      >
        {user && <CreateRideDialog userId={user.id} />}
      </PageHeader>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Routen</CardTitle>
            <Car className="h-4 w-4 text-offer" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offerCount}</div>
            <p className="text-xs text-muted-foreground">
              Fahrer bieten Plätze an
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mitfahrer gesucht</CardTitle>
            <Search className="h-4 w-4 text-request" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestCount}</div>
            <p className="text-xs text-muted-foreground">
              Suchen eine Rückfahrt
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deine Einträge</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRideCount}</div>
            <p className="text-xs text-muted-foreground">
              Aktive Routen von dir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <RideFilters />
      </Suspense>

      {/* Rides List or Empty State */}
      {filteredRides.length > 0 ? (
        <RideList rides={filteredRides} currentUserId={user?.id} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Car className="mb-4 h-12 w-12 text-muted-foreground" />
            <CardTitle className="mb-2">Noch keine Routen</CardTitle>
            <CardDescription className="mb-6 text-center max-w-md">
              Nach einer Fahrzeugüberführung brauchst du eine Rückfahrt?
              Biete freie Plätze an oder finde jemanden, der dich mitnimmt.
            </CardDescription>
            {user && (
              <div className="flex gap-3">
                <CreateRideDialog
                  userId={user.id}
                  trigger={
                    <Button className="bg-offer hover:bg-offer/90">
                      <Plus className="mr-2 h-4 w-4" />
                      Plätze anbieten
                    </Button>
                  }
                />
                <CreateRideDialog
                  userId={user.id}
                  trigger={
                    <Button variant="outline" className="border-request text-request hover:bg-request/10">
                      <Search className="mr-2 h-4 w-4" />
                      Rückfahrt suchen
                    </Button>
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
