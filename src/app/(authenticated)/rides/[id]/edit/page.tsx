import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EditRideForm } from "@/components/rides/edit-ride-form"

interface EditRidePageProps {
  params: Promise<{ id: string }>
}

interface RideRoutePoint {
  type: "start" | "stop" | "end"
  address: string
  lat: number
  lng: number
  order: number
}

interface RideData {
  id: string
  user_id: string
  type: "offer" | "request"
  route: RideRoutePoint[]
  departure_date: string
  departure_time: string | null
  seats_available: number
  comment: string | null
}

export default async function EditRidePage({ params }: EditRidePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch the ride
  const { data, error } = await supabase
    .from("rides")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) {
    notFound()
  }

  const ride = data as unknown as RideData

  // Check if user owns this ride
  if (ride.user_id !== user.id) {
    redirect("/dashboard")
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Route bearbeiten</h1>
      <EditRideForm ride={ride} />
    </div>
  )
}
