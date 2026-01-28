"use client"

import { useState, useMemo } from "react"
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
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
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
import { LocationSearch, reverseGeocode } from "@/components/map/location-search"
import { RouteMap, type MapPoint, type RouteInfo } from "@/components/map"
import { cn } from "@/lib/utils"
import {
  calculateRouteDistance,
  formatDistance,
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

interface CreateRideDrawerProps {
  userId: string
  trigger?: React.ReactNode
}

export function CreateRideDrawer({ userId, trigger }: CreateRideDrawerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showFullMap, setShowFullMap] = useState(false)
  const [mapClickTarget, setMapClickTarget] = useState<number | null>(null)
  const [showMatches, setShowMatches] = useState(true)
  // Store calculated route geometry for submission
  const [calculatedRoute, setCalculatedRoute] = useState<RouteInfo | null>(null)

  const form = useForm<CreateRideFormValues>({
    resolver: zodResolver(createRideSchema),
    mode: "onChange", // Fix: Enables proper field registration without requiring user interaction
    defaultValues: {
      type: "offer",
      route: [
        { id: crypto.randomUUID(), type: "start", address: "", lat: 0, lng: 0, order: 0 },
        { id: crypto.randomUUID(), type: "end", address: "", lat: 0, lng: 0, order: 1 },
      ],
      departure_date: undefined, // Will be set by user via calendar
      departure_time: "",
      seats_available: 3,
      comment: "",
      is_recurring: false,
      recurring_days: [],
      recurring_weeks: 4,
    },
  })

  const { fields, remove, update, replace } = useFieldArray({
    control: form.control,
    name: "route",
  })

  const routeType = form.watch("type")
  const routePoints = form.watch("route")
  const isRecurring = form.watch("is_recurring")
  const recurringDays = form.watch("recurring_days") || []

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

  const sortableIds = useMemo(() => fields.map((f) => f.id), [fields])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)

    const lastIndex = fields.length - 1
    if (oldIndex === 0 || oldIndex === lastIndex || newIndex === 0 || newIndex === lastIndex) {
      return
    }

    const newFields = arrayMove([...fields], oldIndex, newIndex)
    const reorderedFields = newFields.map((field, idx) => ({
      ...field,
      order: idx,
    }))
    replace(reorderedFields)
  }

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
    const endIndex = fields.findIndex((f) => f.type === "end")
    const insertIndex = endIndex >= 0 ? endIndex : fields.length - 1

    const newStop = {
      id: crypto.randomUUID(),
      type: "stop" as const,
      address: "",
      lat: 0,
      lng: 0,
      order: insertIndex,
    }

    const currentFields = [...fields]
    currentFields.splice(insertIndex, 0, newStop)

    const reorderedFields = currentFields.map((field, idx) => ({
      ...field,
      order: idx,
    }))

    replace(reorderedFields)
  }

  function removeStop(index: number) {
    remove(index)
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

  // Use OSRM calculated distance if available, otherwise fallback to simple calculation
  const routeDistance = useMemo(() => {
    if (calculatedRoute?.distance) {
      return calculatedRoute.distance / 1000 // Convert meters to km
    }
    const validPoints = routePoints.filter((p) => p.lat !== 0 && p.lng !== 0)
    if (validPoints.length < 2) return 0
    return calculateRouteDistance(validPoints.sort((a, b) => a.order - b.order))
  }, [routePoints, calculatedRoute])

  // Handler for when route is calculated by RouteMap
  const handleRouteCalculated = (route: RouteInfo | null) => {
    setCalculatedRoute(route)
  }

  async function onSubmit(data: CreateRideFormValues) {
    const invalidPoints = data.route.filter((p) => p.lat === 0 || p.lng === 0)
    if (invalidPoints.length > 0) {
      toast.error("Bitte wähle alle Adressen aus der Suche aus")
      return
    }

    if (data.is_recurring && (!data.recurring_days || data.recurring_days.length === 0)) {
      toast.error("Bitte wähle mindestens einen Wochentag für die Wiederholung")
      return
    }

    setIsLoading(true)
    try {
      let recurringUntil: string | null = null
      if (data.is_recurring && data.recurring_weeks) {
        const untilDate = new Date(data.departure_date)
        untilDate.setDate(untilDate.getDate() + data.recurring_weeks * 7)
        recurringUntil = format(untilDate, "yyyy-MM-dd")
      }

      // Build request body - only include fields that have values
      const requestBody: Record<string, unknown> = {
        type: data.type,
        route: data.route.map((p) => ({
          type: p.type,
          address: p.address,
          lat: Number(p.lat),
          lng: Number(p.lng),
          order: Number(p.order),
        })),
        departure_date: format(data.departure_date, "yyyy-MM-dd"),
        departure_time: data.departure_time || null,
        seats_available: data.type === "offer" ? data.seats_available : 1,
        comment: data.comment || null,
        is_recurring: data.is_recurring || false,
      }

      // Only add recurring fields if actually recurring
      if (data.is_recurring && data.recurring_days && data.recurring_days.length > 0) {
        requestBody.recurring_days = data.recurring_days
        if (recurringUntil) {
          requestBody.recurring_until = recurringUntil
        }
      }

      // TODO: Re-enable route geometry once database columns are verified
      // Temporarily disabled to isolate the error
      // if (calculatedRoute?.geometry && calculatedRoute.geometry.length > 0) {
      //   requestBody.route_geometry = calculatedRoute.geometry
      //   requestBody.route_distance = calculatedRoute.distance
      //   requestBody.route_duration = calculatedRoute.duration
      // }

      const response = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("API Error:", result)
        throw new Error(result.message || result.error || "Failed to create ride")
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
      const errorMsg = error instanceof Error ? error.message : "Unbekannter Fehler"
      toast.error(`Fehler: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    form.reset()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Route einstellen
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className={cn(
          "w-full p-0 flex flex-col [&>button]:hidden",
          // Mobile: Full screen
          "h-full m-0 rounded-none border-0",
          // Desktop: Floating with margins
          "sm:m-4 sm:h-[calc(100vh-2rem)] sm:max-w-xl sm:rounded-lg sm:border sm:shadow-2xl",
          "md:max-w-2xl"
        )}
      >
        <TooltipProvider>
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-xl">Neue Route erstellen</SheetTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium mb-1">So funktioniert&apos;s:</p>
                    <ul className="text-xs space-y-1">
                      <li>1. Wähle ob du Plätze anbietest oder suchst</li>
                      <li>2. Gib Start und Ziel deiner Route ein</li>
                      <li>3. Optional: Füge Zwischenstopps hinzu</li>
                      <li>4. Wähle Datum und ungefähre Abfahrtszeit</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SheetDescription>
              Erstelle eine neue Route für deine Rückfahrt nach der Fahrzeugüberführung.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Form {...form}>
              <form id="create-ride-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Type Selection */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Was möchtest du?</FormLabel>
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Route</FormLabel>
                    <div className="flex items-center gap-2">
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

                    <RouteMap
                      points={mapPoints}
                      height={showFullMap ? "350px" : "180px"}
                      interactive={mapClickTarget !== null}
                      onMapClick={handleMapClick}
                      onRouteCalculated={handleRouteCalculated}
                      showRouteInfo={mapPoints.length >= 2}
                    />

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
                          <PopoverContent className="w-auto p-0" align="start" side="bottom" avoidCollisions>
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date)
                              }}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              locale={de}
                              autoFocus
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
                          onValueChange={(val) => field.onChange(parseInt(val))}
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
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t shrink-0 bg-background">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                form="create-ride-form"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Route erstellen
              </Button>
            </div>
          </div>
        </TooltipProvider>
      </SheetContent>
    </Sheet>
  )
}
