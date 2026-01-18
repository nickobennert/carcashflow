"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Bell, BellOff, Plus, Trash2, MapPin, Navigation, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LocationSearch } from "@/components/map/location-search"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Server-side route watch type
interface RouteWatch {
  id: string
  user_id: string
  type: "location" | "route"
  name: string
  location_lat: number | null
  location_lng: number | null
  location_address: string | null
  radius_km: number
  start_lat: number | null
  start_lng: number | null
  start_address: string | null
  end_lat: number | null
  end_lng: number | null
  end_address: string | null
  ride_type: "offer" | "request" | "both"
  is_active: boolean
  push_enabled: boolean
  email_enabled: boolean
  created_at: string
  updated_at: string
}

interface RouteWatchManagerProps {
  className?: string
}

export function RouteWatchManager({ className }: RouteWatchManagerProps) {
  const [watches, setWatches] = useState<RouteWatch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [watchType, setWatchType] = useState<"location" | "route">("location")

  // Location watch form
  const [locationName, setLocationName] = useState("")
  const [locationAddress, setLocationAddress] = useState("")
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [locationRadius, setLocationRadius] = useState(25)
  const [locationRideType, setLocationRideType] = useState<"offer" | "request" | "both">("both")

  // Route watch form
  const [routeName, setRouteName] = useState("")
  const [startAddress, setStartAddress] = useState("")
  const [startLat, setStartLat] = useState<number | null>(null)
  const [startLng, setStartLng] = useState<number | null>(null)
  const [endAddress, setEndAddress] = useState("")
  const [endLat, setEndLat] = useState<number | null>(null)
  const [endLng, setEndLng] = useState<number | null>(null)
  const [routeRideType, setRouteRideType] = useState<"offer" | "request" | "both">("both")

  // Fetch watches from server
  const fetchWatches = useCallback(async () => {
    try {
      const response = await fetch("/api/route-watches")
      if (response.ok) {
        const { data } = await response.json()
        setWatches(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch watches:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchWatches()
    }
  }, [open, fetchWatches])

  function resetForms() {
    setLocationName("")
    setLocationAddress("")
    setLocationLat(null)
    setLocationLng(null)
    setLocationRadius(25)
    setLocationRideType("both")
    setRouteName("")
    setStartAddress("")
    setStartLat(null)
    setStartLng(null)
    setEndAddress("")
    setEndLat(null)
    setEndLng(null)
    setRouteRideType("both")
  }

  async function handleAddLocationWatch() {
    if (!locationName.trim()) {
      toast.error("Bitte gib einen Namen ein")
      return
    }
    if (!locationLat || !locationLng) {
      toast.error("Bitte wähle einen Ort aus")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/route-watches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "location",
          name: locationName.trim(),
          location_lat: locationLat,
          location_lng: locationLng,
          location_address: locationAddress,
          radius_km: locationRadius,
          ride_type: locationRideType,
        }),
      })

      if (response.ok) {
        await fetchWatches()
        resetForms()
        toast.success(`Benachrichtigung für "${locationName}" aktiviert`)
      } else {
        const { error } = await response.json()
        toast.error(error || "Fehler beim Erstellen der Benachrichtigung")
      }
    } catch (error) {
      console.error("Failed to create location watch:", error)
      toast.error("Fehler beim Erstellen der Benachrichtigung")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddRouteWatch() {
    if (!routeName.trim()) {
      toast.error("Bitte gib einen Namen ein")
      return
    }
    if (!startLat || !startLng || !endLat || !endLng) {
      toast.error("Bitte wähle Start und Ziel aus")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/route-watches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "route",
          name: routeName.trim(),
          start_lat: startLat,
          start_lng: startLng,
          start_address: startAddress,
          end_lat: endLat,
          end_lng: endLng,
          end_address: endAddress,
          ride_type: routeRideType,
        }),
      })

      if (response.ok) {
        await fetchWatches()
        resetForms()
        toast.success(`Benachrichtigung für "${routeName}" aktiviert`)
      } else {
        const { error } = await response.json()
        toast.error(error || "Fehler beim Erstellen der Benachrichtigung")
      }
    } catch (error) {
      console.error("Failed to create route watch:", error)
      toast.error("Fehler beim Erstellen der Benachrichtigung")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(id: string, currentState: boolean) {
    try {
      const response = await fetch(`/api/route-watches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentState }),
      })

      if (response.ok) {
        setWatches((prev) =>
          prev.map((w) => (w.id === id ? { ...w, is_active: !currentState } : w))
        )
        toast.success(!currentState ? "Benachrichtigung aktiviert" : "Benachrichtigung pausiert")
      } else {
        toast.error("Fehler beim Aktualisieren")
      }
    } catch (error) {
      console.error("Failed to toggle watch:", error)
      toast.error("Fehler beim Aktualisieren")
    }
  }

  async function handleDelete(id: string, name: string) {
    try {
      const response = await fetch(`/api/route-watches/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setWatches((prev) => prev.filter((w) => w.id !== id))
        toast.success(`"${name}" gelöscht`)
      } else {
        toast.error("Fehler beim Löschen")
      }
    } catch (error) {
      console.error("Failed to delete watch:", error)
      toast.error("Fehler beim Löschen")
    }
  }

  const activeWatches = watches.filter((w) => w.is_active).length

  return (
    <div className={className}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Benachrichtigungen
            {activeWatches > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeWatches}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Route-Benachrichtigungen
            </DialogTitle>
            <DialogDescription>
              Werde benachrichtigt, wenn neue Fahrten auf deinen Strecken verfügbar sind.
            </DialogDescription>
          </DialogHeader>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Existing Watches */}
          {!loading && watches.length > 0 && (
            <div className="space-y-2 mb-4">
              <Label className="text-sm text-muted-foreground">Aktive Benachrichtigungen</Label>
              <AnimatePresence>
                {watches.map((watch) => (
                  <motion.div
                    key={watch.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      watch.is_active ? "bg-background" : "bg-muted/50 opacity-60"
                    )}
                  >
                    <div className="flex-shrink-0">
                      {watch.type === "location" ? (
                        <MapPin className="h-4 w-4 text-offer" />
                      ) : (
                        <Navigation className="h-4 w-4 text-request" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{watch.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {watch.type === "location" ? (
                          <>{watch.location_address?.split(",")[0]} ({watch.radius_km} km)</>
                        ) : (
                          <>
                            {watch.start_address?.split(",")[0]} → {watch.end_address?.split(",")[0]}
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {watch.ride_type === "both"
                        ? "Alle"
                        : watch.ride_type === "offer"
                        ? "Angebote"
                        : "Gesuche"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleToggle(watch.id, watch.is_active)}
                    >
                      {watch.is_active ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => handleDelete(watch.id, watch.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty State */}
          {!loading && watches.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Noch keine Benachrichtigungen eingerichtet</p>
            </div>
          )}

          {/* Add New Watch */}
          {!loading && (
            <div className="border-t pt-4">
              <Label className="text-sm mb-3 block">Neue Benachrichtigung hinzufügen</Label>
              <Tabs value={watchType} onValueChange={(v) => setWatchType(v as "location" | "route")}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="location" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Ort
                  </TabsTrigger>
                  <TabsTrigger value="route" className="gap-2">
                    <Navigation className="h-4 w-4" />
                    Strecke
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="location" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="z.B. Arbeit, Zuhause..."
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ort</Label>
                    <LocationSearch
                      value={locationAddress}
                      onSelect={(loc) => {
                        setLocationAddress(loc.address)
                        setLocationLat(loc.lat)
                        setLocationLng(loc.lng)
                      }}
                      placeholder="Adresse suchen..."
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Umkreis</Label>
                      <span className="text-sm text-muted-foreground">{locationRadius} km</span>
                    </div>
                    <Slider
                      value={[locationRadius]}
                      onValueChange={([v]) => setLocationRadius(v)}
                      min={5}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Benachrichtigen bei</Label>
                    <Select value={locationRideType} onValueChange={(v) => setLocationRideType(v as typeof locationRideType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Allen neuen Fahrten</SelectItem>
                        <SelectItem value="offer">Nur Angeboten</SelectItem>
                        <SelectItem value="request">Nur Gesuchen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddLocationWatch}
                    className="w-full"
                    disabled={!locationLat || !locationName.trim() || saving}
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Benachrichtigung aktivieren
                  </Button>
                </TabsContent>

                <TabsContent value="route" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="z.B. Pendlerstrecke..."
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start</Label>
                    <LocationSearch
                      value={startAddress}
                      onSelect={(loc) => {
                        setStartAddress(loc.address)
                        setStartLat(loc.lat)
                        setStartLng(loc.lng)
                      }}
                      placeholder="Startadresse..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ziel</Label>
                    <LocationSearch
                      value={endAddress}
                      onSelect={(loc) => {
                        setEndAddress(loc.address)
                        setEndLat(loc.lat)
                        setEndLng(loc.lng)
                      }}
                      placeholder="Zieladresse..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Benachrichtigen bei</Label>
                    <Select value={routeRideType} onValueChange={(v) => setRouteRideType(v as typeof routeRideType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Allen neuen Fahrten</SelectItem>
                        <SelectItem value="offer">Nur Angeboten</SelectItem>
                        <SelectItem value="request">Nur Gesuchen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddRouteWatch}
                    className="w-full"
                    disabled={!startLat || !endLat || !routeName.trim() || saving}
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Benachrichtigung aktivieren
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
