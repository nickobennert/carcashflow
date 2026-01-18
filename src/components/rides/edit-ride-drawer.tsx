"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { motion } from "motion/react"
import { format, parseISO } from "date-fns"
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
  Star,
  Heart,
  X,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LocationSearch, reverseGeocode } from "@/components/map/location-search"
import { RouteMap, type MapPoint, type RouteInfo } from "@/components/map"
import { cn } from "@/lib/utils"
import {
  calculateRouteDistance,
  formatDistance,
  getFavoriteRoutes,
  saveFavoriteRoute,
  deleteFavoriteRoute,
  type FavoriteRoute,
  type RoutePointData,
} from "@/lib/location-storage"

const routePointSchema = z.object({
  id: z.string(),
  type: z.enum(["start", "stop", "end"]),
  address: z.string().min(1, "Adresse erforderlich"),
  lat: z.number(),
  lng: z.number(),
  order: z.number(),
})

const editRideSchema = z.object({
  type: z.enum(["offer", "request"]),
  route: z.array(routePointSchema).min(2, "Mindestens Start und Ziel erforderlich"),
  departure_date: z.date({ message: "Datum erforderlich" }),
  departure_time: z.string().optional(),
  seats_available: z.number().min(1).max(8),
  comment: z.string().max(500).optional(),
})

type EditRideFormValues = z.infer<typeof editRideSchema>
type RoutePoint = z.infer<typeof routePointSchema>

// Route point from database (may not have id)
interface RideRoutePoint {
  type: "start" | "stop" | "end"
  address: string
  lat: number
  lng: number
  order: number
}

// Sortable route item component
interface SortableRouteItemProps {
  field: RoutePoint
  index: number
  isLoading: boolean
  onLocationSelect: (index: number, location: { address: string; lat: number; lng: number }) => void
  onRemove: (index: number) => void
  form: ReturnType<typeof useForm<EditRideFormValues>>
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

interface EditRideDrawerProps {
  ride: {
    id: string
    type: "offer" | "request"
    route: RideRoutePoint[]
    departure_date: string
    departure_time: string | null
    seats_available: number
    comment: string | null
  }
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EditRideDrawer({ ride, trigger, open: controlledOpen, onOpenChange }: EditRideDrawerProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showFullMap, setShowFullMap] = useState(false)
  const [mapClickTarget, setMapClickTarget] = useState<number | null>(null)
  const [favoriteRoutes, setFavoriteRoutes] = useState<FavoriteRoute[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [favoriteName, setFavoriteName] = useState("")

  const supabase = createClient()

  // Support both controlled and uncontrolled modes
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  useEffect(() => {
    if (open) {
      setFavoriteRoutes(getFavoriteRoutes())
    }
  }, [open])

  // Parse the route to ensure IDs exist
  const initialRoute = ride.route.map((point, index) => ({
    ...point,
    id: crypto.randomUUID(),
    order: point.order ?? index,
  }))

  const form = useForm<EditRideFormValues>({
    resolver: zodResolver(editRideSchema),
    defaultValues: {
      type: ride.type,
      route: initialRoute,
      departure_date: parseISO(ride.departure_date),
      departure_time: ride.departure_time || "",
      seats_available: ride.seats_available,
      comment: ride.comment || "",
    },
  })

  // Reset form when ride changes
  useEffect(() => {
    const newInitialRoute = ride.route.map((point, index) => ({
      ...point,
      id: crypto.randomUUID(),
      order: point.order ?? index,
    }))
    form.reset({
      type: ride.type,
      route: newInitialRoute,
      departure_date: parseISO(ride.departure_date),
      departure_time: ride.departure_time || "",
      seats_available: ride.seats_available,
      comment: ride.comment || "",
    })
  }, [ride.id, form])

  const { fields, remove, update, replace } = useFieldArray({
    control: form.control,
    name: "route",
  })

  const routeType = form.watch("type")
  const routePoints = form.watch("route")

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

  function loadFavoriteRoute(favorite: FavoriteRoute) {
    const newFields = favorite.route.map((point, index) => ({
      id: crypto.randomUUID(),
      type: point.type,
      address: point.address,
      lat: point.lat,
      lng: point.lng,
      order: index,
    }))

    replace(newFields)
    toast.success(`Route "${favorite.name}" geladen`)
  }

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

  function handleDeleteFavorite(id: string, name: string) {
    deleteFavoriteRoute(id)
    setFavoriteRoutes(getFavoriteRoutes())
    toast.success(`"${name}" gelöscht`)
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

  const routeDistance = useMemo(() => {
    const validPoints = routePoints.filter((p) => p.lat !== 0 && p.lng !== 0)
    if (validPoints.length < 2) return 0
    return calculateRouteDistance(validPoints.sort((a, b) => a.order - b.order))
  }, [routePoints])

  async function onSubmit(data: EditRideFormValues) {
    const invalidPoints = data.route.filter((p) => p.lat === 0 || p.lng === 0)
    if (invalidPoints.length > 0) {
      toast.error("Bitte wähle alle Adressen aus der Suche aus")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("rides")
        .update({
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
        } as never)
        .eq("id", ride.id)

      if (error) throw error

      toast.success("Route erfolgreich aktualisiert!")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating ride:", error)
      toast.error("Fehler beim Aktualisieren der Route")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("rides").delete().eq("id", ride.id)

      if (error) throw error

      toast.success("Route erfolgreich gelöscht!")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting ride:", error)
      toast.error("Fehler beim Löschen der Route")
    } finally {
      setIsDeleting(false)
    }
  }

  function handleClose() {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 m-4 h-[calc(100vh-2rem)] rounded-lg border shadow-2xl flex flex-col [&>button]:hidden"
      >
        <TooltipProvider>
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-xl">Route bearbeiten</SheetTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium mb-1">Bearbeite deine Route:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Ändere Start, Ziel oder Zwischenstopps</li>
                      <li>• Passe Datum und Uhrzeit an</li>
                      <li>• Aktualisiere die verfügbaren Plätze</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SheetDescription>
              Aktualisiere die Details deiner Route.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Form {...form}>
              <form id="edit-ride-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <Button type="button" size="sm" onClick={saveCurrentRouteAsFavorite}>
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

                    <RouteMap
                      points={mapPoints}
                      height={showFullMap ? "350px" : "180px"}
                      interactive={mapClickTarget !== null}
                      onMapClick={handleMapClick}
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
                          value={field.value?.toString()}
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
            <div className="flex justify-between gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isDeleting || isLoading}
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Trash2 className="mr-2 h-4 w-4" />
                    Route löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Route wirklich löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion kann nicht rückgängig gemacht werden. Die Route wird
                      dauerhaft gelöscht.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading || isDeleting}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  form="edit-ride-form"
                  disabled={isLoading || isDeleting}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Speichern
                </Button>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </SheetContent>
    </Sheet>
  )
}
