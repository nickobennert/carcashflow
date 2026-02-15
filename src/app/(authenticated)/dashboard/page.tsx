import { Suspense } from "react"
import { Metadata } from "next"
import { Plus, Car, Search, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RideList, RideFilters, CreateRideDrawer } from "@/components/rides"
import { DismissibleDisclaimer } from "@/components/legal/dismissible-disclaimer"
import type { RideWithUser } from "@/types"

export const metadata: Metadata = {
  title: "Rückfahrten",
  description: "Finde Mitfahrgelegenheiten für deine Rückfahrt nach der Fahrzeugüberführung",
}

export interface MatchParams {
  match_start_lat?: string
  match_start_lng?: string
  match_end_lat?: string
  match_end_lng?: string
  match_type?: string
  match_date?: string
  nearby_lat?: string
  nearby_lng?: string
  nearby_radius?: string
}

interface DashboardPageProps {
  searchParams: Promise<{
    type?: string
    search?: string
    date?: string
  } & MatchParams>
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

  // Execute rides query and user count in parallel
  const userCountQuery = user
    ? supabase
        .from("rides")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("departure_date", new Date().toISOString().split("T")[0])
    : null

  const [ridesResult, userCountResult] = await Promise.all([
    query.then((res) => res as { data: RideWithUser[] | null }),
    userCountQuery,
  ])

  // Type assertion for the joined data
  const rides = (ridesResult.data || []) as RideWithUser[]
  const userRideCount = userCountResult?.count || 0

  // Filter by search term if provided (client-side for address search in JSONB)
  const filteredRides = params.search
    ? rides.filter((ride) => {
        const searchLower = params.search!.toLowerCase()
        return ride.route.some((point) =>
          point.address.toLowerCase().includes(searchLower)
        )
      })
    : rides

  // Extract match params for route-based matching in the feed
  const hasMatchParams = !!(params.match_start_lat || params.nearby_lat)
  const matchParams: MatchParams | undefined = hasMatchParams
    ? {
        match_start_lat: params.match_start_lat,
        match_start_lng: params.match_start_lng,
        match_end_lat: params.match_end_lat,
        match_end_lng: params.match_end_lng,
        match_type: params.match_type,
        match_date: params.match_date,
        nearby_lat: params.nearby_lat,
        nearby_lng: params.nearby_lng,
        nearby_radius: params.nearby_radius,
      }
    : undefined

  // Get counts from filtered rides (only active future rides)
  const offerCount = rides.filter((r) => r.type === "offer").length
  const requestCount = rides.filter((r) => r.type === "request").length

  return (
    <div className="space-y-6">
      {/* Legal Disclaimer - Dismissible */}
      <DismissibleDisclaimer userId={user?.id} />

      {/* Page Header */}
      <PageHeader
        title="Rückfahrten"
        description="Finde Mitfahrgelegenheiten nach deiner Fahrzeugüberführung"
      >
        {user && <CreateRideDrawer userId={user.id} />}
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
      {filteredRides.length > 0 || matchParams ? (
        <RideList rides={filteredRides} currentUserId={user?.id} matchParams={matchParams} />
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
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <CreateRideDrawer
                  userId={user.id}
                  trigger={
                    <Button className="bg-offer hover:bg-offer/90 w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Plätze anbieten
                    </Button>
                  }
                />
                <CreateRideDrawer
                  userId={user.id}
                  trigger={
                    <Button variant="outline" className="border-request text-request hover:bg-request/10 w-full sm:w-auto">
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
