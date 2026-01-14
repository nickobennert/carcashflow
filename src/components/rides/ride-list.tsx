"use client"

import { Car } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { RideCard } from "./ride-card"
import type { RideWithUser } from "@/types"

interface RideListProps {
  rides: RideWithUser[]
  currentUserId?: string
  emptyMessage?: string
}

export function RideList({ rides, currentUserId, emptyMessage }: RideListProps) {
  if (rides.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Car className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{emptyMessage || "Keine Routen gefunden"}</p>
          <p className="text-sm text-muted-foreground mt-1">Versuche andere Filteroptionen</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rides.map((ride) => (
        <RideCard key={ride.id} ride={ride} currentUserId={currentUserId} />
      ))}
    </div>
  )
}
