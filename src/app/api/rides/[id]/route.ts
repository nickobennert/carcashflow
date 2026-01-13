import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { RideUpdate, RoutePoint } from "@/types"

interface RouteParams {
  params: Promise<{ id: string }>
}

// Type for ride data
type RideData = { id: string; user_id: string; status: string }

// GET /api/rides/[id] - Get a single ride
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from("rides")
      .select(`
        *,
        profiles:user_id (
          id, username, first_name, last_name, avatar_url, city, bio
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Ride not found" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching ride:", error)
    return NextResponse.json(
      { error: "Failed to fetch ride" },
      { status: 500 }
    )
  }
}

// PUT /api/rides/[id] - Update a ride
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if the ride belongs to the user
    const { data: rideData, error: fetchError } = await supabase
      .from("rides")
      .select("id, user_id, status")
      .eq("id", id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Ride not found" }, { status: 404 })
      }
      throw fetchError
    }

    const existingRide = rideData as RideData
    if (existingRide.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own rides" },
        { status: 403 }
      )
    }

    if (existingRide.status !== "active") {
      return NextResponse.json(
        { error: "Only active rides can be edited" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { type, route, departure_date, departure_time, seats_available, comment, status } = body

    // Build update object with only provided fields
    const updateData: RideUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (type !== undefined) {
      if (!["offer", "request"].includes(type)) {
        return NextResponse.json(
          { error: "Invalid type. Must be 'offer' or 'request'" },
          { status: 400 }
        )
      }
      updateData.type = type
    }

    if (route !== undefined) {
      if (!Array.isArray(route) || route.length < 2) {
        return NextResponse.json(
          { error: "Route must have at least start and end points" },
          { status: 400 }
        )
      }
      const hasStart = route.some((p: RoutePoint) => p.type === "start")
      const hasEnd = route.some((p: RoutePoint) => p.type === "end")
      if (!hasStart || !hasEnd) {
        return NextResponse.json(
          { error: "Route must have start and end points" },
          { status: 400 }
        )
      }
      updateData.route = route.map((point: RoutePoint, index: number) => ({
        ...point,
        order: index,
      }))
    }

    if (departure_date !== undefined) {
      updateData.departure_date = departure_date

      // Recalculate expiration
      const departureDate = new Date(departure_date)
      const sevenDaysAfterDeparture = new Date(departureDate)
      sevenDaysAfterDeparture.setDate(sevenDaysAfterDeparture.getDate() + 7)

      const fourteenDaysFromNow = new Date()
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14)

      updateData.expires_at = departureDate < new Date()
        ? sevenDaysAfterDeparture.toISOString()
        : new Date(Math.max(sevenDaysAfterDeparture.getTime(), fourteenDaysFromNow.getTime())).toISOString()
    }

    if (departure_time !== undefined) {
      updateData.departure_time = departure_time || null
    }

    if (seats_available !== undefined) {
      updateData.seats_available = seats_available
    }

    if (comment !== undefined) {
      updateData.comment = comment || null
    }

    if (status !== undefined) {
      if (!["active", "completed", "cancelled"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    const { data, error } = await supabase
      .from("rides")
      .update(updateData as never)
      .eq("id", id)
      .select(`
        *,
        profiles:user_id (
          id, username, first_name, last_name, avatar_url, city, bio
        )
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error updating ride:", error)
    return NextResponse.json(
      { error: "Failed to update ride" },
      { status: 500 }
    )
  }
}

// DELETE /api/rides/[id] - Delete a ride
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if the ride belongs to the user
    const { data: rideData2, error: fetchError } = await supabase
      .from("rides")
      .select("id, user_id")
      .eq("id", id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Ride not found" }, { status: 404 })
      }
      throw fetchError
    }

    const existingRide = rideData2 as { id: string; user_id: string }
    if (existingRide.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own rides" },
        { status: 403 }
      )
    }

    // Soft delete by setting status to cancelled (preserves data for conversations)
    const { error } = await supabase
      .from("rides")
      .update({ status: "cancelled", updated_at: new Date().toISOString() } as never)
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Ride deleted successfully" })
  } catch (error) {
    console.error("Error deleting ride:", error)
    return NextResponse.json(
      { error: "Failed to delete ride" },
      { status: 500 }
    )
  }
}
