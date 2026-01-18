"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { motion } from "motion/react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Plus,
  Trash2,
  Loader2,
  CalendarIcon,
  GripVertical,
  Car,
  Search,
  HelpCircle,
  MapIcon,
  Navigation,
  Repeat,
  Star,
  StarOff,
  Heart,
  MoreHorizontal,
} from "lucide-react"
import { toast } from "sonner"

// Using API routes instead of direct Supabase access
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LocationSearch, reverseGeocode } from "@/components/map/location-search"
import { RouteMap, type MapPoint } from "@/components/map"
import { fadeIn } from "@/lib/animations"
import { cn } from "@/lib/utils"
import {
  calculateRouteDistance,
  formatDistance,
  getFavoriteRoutes,
  saveFavoriteRoute,
  deleteFavoriteRoute,
  incrementFavoriteRouteUseCount,
  type FavoriteRoute,
  type RoutePointData,
} from "@/lib/location-storage"
import { MatchingRides } from "./matching-rides"

const routePointSchema = z.object({
  id: z.string(),
  type: z.enum(["start", "stop", "end"]),
  address: z.string().min(1, "Adresse erforderlich"),
  lat: z.number(),
  lng: z.number(),
  order: z.number(),
})

const createRideSchema = z.object({
  type: z.enum(["offer", "request"]),
  route: z.array(routePointSchema).min(2, "Mindestens Start und Ziel erforderlich"),
  departure_date: z.date({ message: "Datum erforderlich" }),
  departure_time: z.string().optional(),
  seats_available: z.number().min(1).max(8),
  comment: z.string().max(500).optional(),
  is_recurring: z.boolean(),
  recurring_days: z.array(z.number().min(0).max(6)).optional().nullable(),
  recurring_weeks: z.number().min(1).max(12).optional().nullable(),
})

// Weekday labels for recurring rides
const WEEKDAYS = [
  { value: 0, label: "So", fullLabel: "Sonntag" },
  { value: 1, label: "Mo", fullLabel: "Montag" },
  { value: 2, label: "Di", fullLabel: "Dienstag" },
  { value: 3, label: "Mi", fullLabel: "Mittwoch" },
  { value: 4, label: "Do", fullLabel: "Donnerstag" },
  { value: 5, label: "Fr", fullLabel: "Freitag" },
  { value: 6, label: "Sa", fullLabel: "Samstag" },
]

type CreateRideFormValues = z.infer<typeof createRideSchema>
type RoutePoint = z.infer<typeof routePointSchema>

// Sortable route item component
interface SortableRouteItemProps {
  field: RoutePoint
  index: number
  isLoading: boolean
  onLocationSelect: (index: number, location: { address: string; lat: number; lng: number }) => void
  onRemove: (index: number) => void
  form: ReturnType<typeof useForm<CreateRideFormValues>>
}

function SortableRouteItem({
  field,
  index,
  isLoading,
  onLocationSelect,
  onRemove,
  form,
}: SortableRouteItemProps) {
  const isStop = field.type === "stop"

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id, disabled: !isStop })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg",
        isDragging && "bg-muted/50 shadow-lg"
      )}
    >
      {/* Drag handle - only for stops */}
      {isStop ? (
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing p-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      ) : (
        <div className="w-7" />
      )}

      {/* Input field with colored pin inside */}
      <div className="flex-1">
        <FormField
          control={form.control}
          name={`route.${index}.address`}
          render={() => (
            <FormItem className="space-y-0">
              <FormControl>
                <LocationSearch
                  value={field.address}
                  onSelect={(loc) => onLocationSelect(index, loc)}
                  placeholder={
                    field.type === "start"
                      ? "Startadresse (Abgabeort)"
                      : field.type === "end"
                        ? "Zieladresse"
                        : "Zwischenstopp"
                  }
                  disabled={isLoading}
                  pinColor={field.type}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Delete button for stops */}
      {isStop ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : (
        <div className="w-9" />
      )}
    </div>
  )
}

interface CreateRideDialogProps {
  userId: string
  trigger?: React.ReactNode
}

export function CreateRideDialog({ userId, trigger }: CreateRideDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showFullMap, setShowFullMap] = useState(false)
  const [mapClickTarget, setMapClickTarget] = useState<number | null>(null)
  const [showMatches, setShowMatches] = useState(true)
  const [favoriteRoutes, setFavoriteRoutes] = useState<FavoriteRoute[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [favoriteName, setFavoriteName] = useState("")

  // Load favorite routes when dialog opens
  useEffect(() => {
    if (open) {
      setFavoriteRoutes(getFavoriteRoutes())
    }
  }, [open])

  const form = useForm<CreateRideFormValues>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      type: "offer",
      route: [
        { id: crypto.randomUUID(), type: "start", address: "", lat: 0, lng: 0, order: 0 },
        { id: crypto.randomUUID(), type: "end", address: "", lat: 0, lng: 0, order: 1 },
      ],
      departure_time: "",
      seats_available: 3,
      comment: "",
      is_recurring: false,
      recurring_days: [],
      recurring_weeks: 4,
    },
  })

  const { fields, append, remove, update, replace } = useFieldArray({
    control: form.control,
    name: "route",
  })

  const routeType = form.watch("type")
  const routePoints = form.watch("route")
  const isRecurring = form.watch("is_recurring")
  const recurringDays = form.watch("recurring_days") || []

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get sortable item IDs (only stops can be sorted)
  const sortableIds = useMemo(() => fields.map((f) => f.id), [fields])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)

    // Don't allow dragging start (index 0) or end (last index)
    const lastIndex = fields.length - 1
    if (oldIndex === 0 || oldIndex === lastIndex || newIndex === 0 || newIndex === lastIndex) {
      return
    }

    const newFields = arrayMove([...fields], oldIndex, newIndex)
    // Recalculate orders
    const reorderedFields = newFields.map((field, idx) => ({
      ...field,
      order: idx,
    }))
    replace(reorderedFields)
  }

  // Convert form route to MapPoints for the map
  const mapPoints: MapPoint[] = routePoints
    .filter((p) => p.lat !== 0 && p.lng !== 0)
    .map((p) => ({
      id: p.id,
      type: p.type,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      order: p.order,
    }))

  function addStop() {
    // Insert stop before the end point
    const endIndex = fields.findIndex((f) => f.type === "end")
    const insertIndex = endIndex >= 0 ? endIndex : fields.length - 1

    // Create the new stop
    const newStop = {
      id: crypto.randomUUID(),
      type: "stop" as const,
      address: "",
      lat: 0,
      lng: 0,
      order: insertIndex,
    }

    // Get current fields, insert new stop before end, and recalculate orders
    const currentFields = [...fields]
    currentFields.splice(insertIndex, 0, newStop)

    // Update all orders
    const reorderedFields = currentFields.map((field, idx) => ({
      ...field,
      order: idx,
    }))

    replace(reorderedFields)
  }

  function removeStop(index: number) {
    remove(index)
    // Recalculate orders
    setTimeout(() => {
      const currentFields = form.getValues("route")
      currentFields.forEach((field, idx) => {
        update(idx, { ...field, order: idx })
      })
    }, 0)
  }

  function handleLocationSelect(index: number, location: { address: string; lat: number; lng: number }) {
    const currentField = fields[index]
    update(index, {
      ...currentField,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
    })
  }

  // Load a favorite route
  function loadFavoriteRoute(favorite: FavoriteRoute) {
    // Create new fields from the favorite route
    const newFields = favorite.route.map((point, index) => ({
      id: crypto.randomUUID(),
      type: point.type,
      address: point.address,
      lat: point.lat,
      lng: point.lng,
      order: index,
    }))

    replace(newFields)
    incrementFavoriteRouteUseCount(favorite.id)
    toast.success(`Route "${favorite.name}" geladen`)
  }

  // Save current route as favorite
  function saveCurrentRouteAsFavorite() {
    const validPoints = routePoints.filter((p) => p.lat !== 0 && p.lng !== 0)
    if (validPoints.length < 2) {
      toast.error("Bitte füge mindestens Start und Ziel hinzu")
      return
    }

    if (!favoriteName.trim()) {
      toast.error("Bitte gib einen Namen ein")
      return
    }

    const routeData: RoutePointData[] = routePoints.map((p) => ({
      type: p.type,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      order: p.order,
    }))

    const saved = saveFavoriteRoute(favoriteName.trim(), routeData)
    if (saved) {
      setFavoriteRoutes(getFavoriteRoutes())
      setShowSaveDialog(false)
      setFavoriteName("")
      toast.success(`Route als "${favoriteName}" gespeichert`)
    }
  }

  // Delete a favorite route
  function handleDeleteFavorite(id: string, name: string) {
    deleteFavoriteRoute(id)
    setFavoriteRoutes(getFavoriteRoutes())
    toast.success(`"${name}" gelöscht`)
  }

  // Handle map click for reverse geocoding
  async function handleMapClick(lat: number, lng: number) {
    if (mapClickTarget === null) return

    const address = await reverseGeocode(lat, lng)
    if (address) {
      handleLocationSelect(mapClickTarget, { address, lat, lng })
      toast.success(`${fields[mapClickTarget].type === "start" ? "Start" : fields[mapClickTarget].type === "end" ? "Ziel" : "Stopp"} gesetzt`)
    } else {
      toast.error("Adresse konnte nicht ermittelt werden")
    }
    setMapClickTarget(null)
  }

  // Calculate total route distance
  const routeDistance = useMemo(() => {
    const validPoints = routePoints.filter((p) => p.lat !== 0 && p.lng !== 0)
    if (validPoints.length < 2) return 0
    return calculateRouteDistance(validPoints.sort((a, b) => a.order - b.order))
  }, [routePoints])

  async function onSubmit(data: CreateRideFormValues) {
    // Validate that all route points have coordinates
    const invalidPoints = data.route.filter((p) => p.lat === 0 || p.lng === 0)
    if (invalidPoints.length > 0) {
      toast.error("Bitte wähle alle Adressen aus der Suche aus")
      return
    }

    // Validate recurring rides
    if (data.is_recurring && (!data.recurring_days || data.recurring_days.length === 0)) {
      toast.error("Bitte wähle mindestens einen Wochentag für die Wiederholung")
      return
    }

    setIsLoading(true)
    try {
      // Calculate recurring_until date
      let recurringUntil: string | null = null
      if (data.is_recurring && data.recurring_weeks) {
        const untilDate = new Date(data.departure_date)
        untilDate.setDate(untilDate.getDate() + data.recurring_weeks * 7)
        recurringUntil = format(untilDate, "yyyy-MM-dd")
      }

      const response = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.type,
          route: data.route.map((p) => ({
            type: p.type,
            address: p.address,
            lat: p.lat,
            lng: p.lng,
            order: p.order,
          })),
          departure_date: format(data.departure_date, "yyyy-MM-dd"),
          departure_time: data.departure_time || null,
          seats_available: data.type === "offer" ? data.seats_available : 1,
          comment: data.comment || null,
          is_recurring: data.is_recurring,
          recurring_days: data.is_recurring ? data.recurring_days : null,
          recurring_until: recurringUntil,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create ride")
      }

      const successMessage = data.is_recurring
        ? `Route erfolgreich erstellt! ${data.recurring_days?.length} Wochentage für ${data.recurring_weeks} Wochen.`
        : "Route erfolgreich erstellt!"
      toast.success(successMessage)
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      console.error("Error creating ride:", error)
      toast.error("Fehler beim Erstellen der Route")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Route einstellen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <TooltipProvider>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>Neue Route erstellen</DialogTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="font-medium mb-1">So funktioniert&apos;s:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Wähle ob du Plätze anbietest oder suchst</li>
                    <li>• Gib Start und Ziel deiner Route ein</li>
                    <li>• Optional: Füge Zwischenstopps hinzu</li>
                    <li>• Wähle Datum und ungefähre Abfahrtszeit</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
            <DialogDescription>
              Erstelle eine neue Route für deine Rückfahrt nach der Fahrzeugüberführung.
            </DialogDescription>
          </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 group">
                    <FormLabel>Was möchtest du?</FormLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Entscheide ob du freie Plätze anbietest oder eine Mitfahrt suchst
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <FormControl>
                    <Tabs
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="offer" className="gap-2">
                          <Car className="h-4 w-4" />
                          Plätze anbieten
                        </TabsTrigger>
                        <TabsTrigger value="request" className="gap-2">
                          <Search className="h-4 w-4" />
                          Mitfahrt suchen
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                  <FormDescription>
                    {field.value === "offer"
                      ? "Du hast freie Plätze und nimmst andere mit"
                      : "Du suchst jemanden, der dich mitnimmt"}
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Route Points */}
            <div className="space-y-4">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <FormLabel>Route</FormLabel>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Gib Start- und Zieladresse ein. Zwischenstopps können per Drag & Drop sortiert werden.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  {/* Favorites Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Star className="mr-2 h-4 w-4" />
                        Favoriten
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>Gespeicherte Routen</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {favoriteRoutes.length === 0 ? (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                          Noch keine Favoriten gespeichert
                        </div>
                      ) : (
                        favoriteRoutes.map((fav) => (
                          <DropdownMenuItem
                            key={fav.id}
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => loadFavoriteRoute(fav)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{fav.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {fav.route.find((p) => p.type === "start")?.address?.split(",")[0]} →{" "}
                                {fav.route.find((p) => p.type === "end")?.address?.split(",")[0]}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFavorite(fav.id, fav.name)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </DropdownMenuItem>
                        ))
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowSaveDialog(true)}
                        disabled={routePoints.filter((p) => p.lat !== 0).length < 2}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        Aktuelle Route speichern
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStop}
                    disabled={fields.length >= 5}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Zwischenstopp
                  </Button>
                </div>
              </div>

              {/* Save Favorite Dialog */}
              {showSaveDialog && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border"
                >
                  <Input
                    placeholder="Name für diese Route..."
                    value={favoriteName}
                    onChange={(e) => setFavoriteName(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        saveCurrentRouteAsFavorite()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={saveCurrentRouteAsFavorite}
                  >
                    Speichern
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowSaveDialog(false)
                      setFavoriteName("")
                    }}
                  >
                    Abbrechen
                  </Button>
                </motion.div>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <SortableRouteItem
                        key={field.id}
                        field={field}
                        index={index}
                        isLoading={isLoading}
                        onLocationSelect={handleLocationSelect}
                        onRemove={removeStop}
                        form={form}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Map Section */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {routeDistance > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Navigation className="h-4 w-4" />
                        <span>ca. {formatDistance(routeDistance)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {mapClickTarget !== null && (
                      <span className="text-xs text-muted-foreground animate-pulse">
                        Klicke auf die Karte...
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullMap(!showFullMap)}
                    >
                      <MapIcon className="mr-2 h-4 w-4" />
                      {showFullMap ? "Karte verkleinern" : "Karte vergrößern"}
                    </Button>
                  </div>
                </div>

                {/* Map */}
                <motion.div variants={fadeIn} initial="initial" animate="animate">
                  <RouteMap
                    points={mapPoints}
                    height={showFullMap ? "400px" : "200px"}
                    interactive={mapClickTarget !== null}
                    onMapClick={handleMapClick}
                  />
                </motion.div>

                {/* Map click buttons */}
                {showFullMap && (
                  <div className="flex flex-wrap gap-2">
                    <p className="w-full text-xs text-muted-foreground mb-1">
                      Klicke auf einen Button und dann auf die Karte, um die Adresse zu setzen:
                    </p>
                    {fields.map((field, index) => (
                      <Button
                        key={field.id}
                        type="button"
                        variant={mapClickTarget === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMapClickTarget(mapClickTarget === index ? null : index)}
                        className={cn(
                          "text-xs",
                          field.type === "start" && "border-offer text-offer hover:bg-offer/10",
                          field.type === "end" && "border-destructive text-destructive hover:bg-destructive/10",
                          field.type === "stop" && "border-blue-500 text-blue-500 hover:bg-blue-500/10",
                          mapClickTarget === index && "bg-primary text-primary-foreground"
                        )}
                      >
                        {field.type === "start" ? "Start" : field.type === "end" ? "Ziel" : `Stopp ${index}`}
                        {field.address && " ✓"}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Matching Rides Suggestion */}
              {showMatches && mapPoints.length >= 2 && (
                <MatchingRides
                  route={routePoints.map((p) => ({
                    type: p.type,
                    address: p.address,
                    lat: p.lat,
                    lng: p.lng,
                    order: p.order,
                  }))}
                  type={routeType}
                  departureDate={form.watch("departure_date")}
                  onClose={() => setShowMatches(false)}
                />
              )}
            </div>

            {/* Date & Time */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="departure_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Datum *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: de })
                            ) : (
                              <span>Datum wählen</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          locale={de}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departure_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abfahrt (optional)</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className={cn(!field.value && "text-muted-foreground")}>
                          <SelectValue placeholder="Abfahrtszeit wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {Array.from({ length: 24 }, (_, hour) =>
                          [0, 30].map((minute) => {
                            const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
                            return (
                              <SelectItem key={time} value={time}>
                                {time} Uhr
                              </SelectItem>
                            )
                          })
                        ).flat()}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recurring Rides */}
            <div className="space-y-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="is_recurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                        Wöchentlich wiederholen
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Route automatisch für mehrere Wochen erstellen
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {isRecurring && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Day selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Wochentage</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((day) => {
                        const isSelected = recurringDays.includes(day.value)
                        return (
                          <Button
                            key={day.value}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "w-10 h-10",
                              isSelected && "bg-offer hover:bg-offer/90"
                            )}
                            onClick={() => {
                              const current = form.getValues("recurring_days") || []
                              if (isSelected) {
                                form.setValue("recurring_days", current.filter((d) => d !== day.value))
                              } else {
                                form.setValue("recurring_days", [...current, day.value].sort())
                              }
                            }}
                            title={day.fullLabel}
                          >
                            {day.label}
                          </Button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {recurringDays.length === 0
                        ? "Wähle mindestens einen Tag"
                        : `${recurringDays.length} ${recurringDays.length === 1 ? "Tag" : "Tage"} ausgewählt`}
                    </p>
                  </div>

                  {/* Duration selection */}
                  <FormField
                    control={form.control}
                    name="recurring_weeks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dauer</FormLabel>
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(val) => field.onChange(parseInt(val))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wochen wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 6, 8, 12].map((weeks) => (
                              <SelectItem key={weeks} value={weeks.toString()}>
                                {weeks} {weeks === 1 ? "Woche" : "Wochen"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {field.value && recurringDays.length > 0
                            ? `${recurringDays.length * (field.value || 0)} Fahrten werden erstellt`
                            : "Wie lange soll die Route wiederholt werden?"}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </div>

            {/* Seats (only for offers) */}
            {routeType === "offer" && (
              <FormField
                control={form.control}
                name="seats_available"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Freie Plätze</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Anzahl wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? "Platz" : "Plätze"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kommentar (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="z.B. Flexibel bei der Abfahrtszeit, kann auch Umwege fahren..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/500 Zeichen
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Route erstellen
              </Button>
            </div>
          </form>
        </Form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  )
}
