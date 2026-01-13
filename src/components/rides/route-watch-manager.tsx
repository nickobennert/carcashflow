"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Bell, BellOff, Plus, Trash2, MapPin, Navigation, X } from "lucide-react"
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
import {
  getRouteWatches,
  addLocationWatch,
  addRouteWatch,
  deleteRouteWatch,
  toggleRouteWatch,
  type RouteWatch,
} from "@/lib/location-storage"
import { cn } from "@/lib/utils"

interface RouteWatchManagerProps {
  className?: string
}

export function RouteWatchManager({ className }: RouteWatchManagerProps) {
  const [watches, setWatches] = useState<RouteWatch[]>([])
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

  useEffect(() => {
    setWatches(getRouteWatches())
  }, [])

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

  function handleAddLocationWatch() {
    if (!locationName.trim()) {
      toast.error("Bitte gib einen Namen ein")
      return
    }
    if (!locationLat || !locationLng) {
      toast.error("Bitte wähle einen Ort aus")
      return
    }

    const watch = addLocationWatch(
      locationName.trim(),
      { address: locationAddress, lat: locationLat, lng: locationLng },
      locationRadius,
      locationRideType
    )

    if (watch) {
      setWatches(getRouteWatches())
      resetForms()
      toast.success(`Benachrichtigung für "${locationName}" aktiviert`)
    } else {
      toast.error("Maximale Anzahl an Benachrichtigungen erreicht")
    }
  }

  function handleAddRouteWatch() {
    if (!routeName.trim()) {
      toast.error("Bitte gib einen Namen ein")
      return
    }
    if (!startLat || !startLng || !endLat || !endLng) {
      toast.error("Bitte wähle Start und Ziel aus")
      return
    }

    const watch = addRouteWatch(
      routeName.trim(),
      { address: startAddress, lat: startLat, lng: startLng },
      { address: endAddress, lat: endLat, lng: endLng },
      routeRideType
    )

    if (watch) {
      setWatches(getRouteWatches())
      resetForms()
      toast.success(`Benachrichtigung für "${routeName}" aktiviert`)
    } else {
      toast.error("Maximale Anzahl an Benachrichtigungen erreicht")
    }
  }

  function handleToggle(id: string) {
    const newState = toggleRouteWatch(id)
    setWatches(getRouteWatches())
    toast.success(newState ? "Benachrichtigung aktiviert" : "Benachrichtigung pausiert")
  }

  function handleDelete(id: string, name: string) {
    deleteRouteWatch(id)
    setWatches(getRouteWatches())
    toast.success(`"${name}" gelöscht`)
  }

  const activeWatches = watches.filter((w) => w.isActive).length

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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Route-Benachrichtigungen
            </DialogTitle>
            <DialogDescription>
              Werde benachrichtigt, wenn neue Fahrten auf deinen Strecken verfügbar sind.
            </DialogDescription>
          </DialogHeader>

          {/* Existing Watches */}
          {watches.length > 0 && (
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
                      watch.isActive ? "bg-background" : "bg-muted/50 opacity-60"
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
                          <>{watch.address?.split(",")[0]} ({watch.radius} km)</>
                        ) : (
                          <>
                            {watch.startAddress?.split(",")[0]} → {watch.endAddress?.split(",")[0]}
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {watch.rideType === "both"
                        ? "Alle"
                        : watch.rideType === "offer"
                        ? "Angebote"
                        : "Gesuche"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(watch.id)}
                    >
                      {watch.isActive ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(watch.id, watch.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Add New Watch */}
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
                  disabled={!locationLat || !locationName.trim()}
                >
                  <Plus className="mr-2 h-4 w-4" />
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
                  disabled={!startLat || !endLat || !routeName.trim()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Benachrichtigung aktivieren
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
