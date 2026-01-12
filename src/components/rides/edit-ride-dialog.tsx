"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
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
  Pencil,
} from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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
import { LocationSearch } from "@/components/map/location-search"
import { RouteMap, type MapPoint } from "@/components/map"
import { cn } from "@/lib/utils"

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

interface RideRoutePoint {
  type: "start" | "stop" | "end"
  address: string
  lat: number
  lng: number
  order: number
}

interface RideData {
  id: string
  type: "offer" | "request"
  route: RideRoutePoint[]
  departure_date: string
  departure_time: string | null
  seats_available: number
  comment: string | null
}

// Sortable route item component
function SortableRouteItem({
  field,
  index,
  isLoading,
  onLocationSelect,
  onRemove,
  form,
}: {
  field: RoutePoint
  index: number
  isLoading: boolean
  onLocationSelect: (index: number, location: { address: string; lat: number; lng: number }) => void
  onRemove: (index: number) => void
  form: ReturnType<typeof useForm<EditRideFormValues>>
}) {
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

interface EditRideDialogProps {
  ride: RideData
  trigger?: React.ReactNode
}

export function EditRideDialog({ ride, trigger }: EditRideDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

  // Parse the route to ensure IDs exist and sort by order
  // Also ensure first is always "start" and last is always "end"
  const sortedRoute = [...ride.route].sort((a, b) => a.order - b.order)
  const initialRoute = sortedRoute.map((point, index) => ({
    ...point,
    id: crypto.randomUUID(),
    order: index,
    // Ensure correct types based on position
    type: index === 0 ? "start" as const
        : index === sortedRoute.length - 1 ? "end" as const
        : "stop" as const,
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

  const { fields, append, remove, update, replace } = useFieldArray({
    control: form.control,
    name: "route",
  })

  const routeType = form.watch("type")
  const routePoints = form.watch("route")

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Bearbeiten
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Route bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeite deine Route oder lösche sie.
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

              {mapPoints.length >= 2 && (
                <RouteMap points={mapPoints} height="200px" className="mt-4" />
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
                      value={field.value || undefined}
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
                      onValueChange={(value) => field.onChange(parseInt(value))}
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

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                      Löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-3">
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
                  Speichern
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
