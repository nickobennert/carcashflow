"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Upload, X, Image as ImageIcon, Video } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const bugReportSchema = z.object({
  title: z.string().min(5, "Titel muss mindestens 5 Zeichen lang sein").max(100),
  area: z.string().min(1, "Bitte wähle einen Bereich aus"),
  description: z.string().min(20, "Beschreibung muss mindestens 20 Zeichen lang sein").max(2000),
  workedBefore: z.string().optional(),
  expectedBehavior: z.string().optional(),
  screencastUrl: z.string().url("Bitte gib eine gültige URL ein").optional().or(z.literal("")),
})

type BugReportFormValues = z.infer<typeof bugReportSchema>

const areaOptions = [
  { value: "route-creation", label: "Fahrt erstellen" },
  { value: "route-search", label: "Fahrt suchen / Matching" },
  { value: "messages", label: "Nachrichten" },
  { value: "profile", label: "Profil" },
  { value: "settings", label: "Einstellungen" },
  { value: "notifications", label: "Benachrichtigungen" },
  { value: "login-signup", label: "Anmeldung / Registrierung" },
  { value: "map", label: "Karte / Navigation" },
  { value: "other", label: "Sonstiges" },
]

interface BugReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [screenshots, setScreenshots] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<BugReportFormValues>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      title: "",
      area: "",
      description: "",
      workedBefore: "",
      expectedBehavior: "",
      screencastUrl: "",
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    const validFiles = files.filter((file) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Nur JPG, PNG und WebP erlaubt`)
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: Datei zu groß (max. 5MB)`)
        return false
      }
      return true
    })

    if (screenshots.length + validFiles.length > 3) {
      toast.error("Maximal 3 Screenshots erlaubt")
      return
    }

    setScreenshots((prev) => [...prev, ...validFiles])

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(data: BugReportFormValues) {
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("title", data.title)
      formData.append("area", data.area)
      formData.append("description", data.description)
      if (data.workedBefore) formData.append("workedBefore", data.workedBefore)
      if (data.expectedBehavior) formData.append("expectedBehavior", data.expectedBehavior)
      if (data.screencastUrl) formData.append("screencastUrl", data.screencastUrl)

      // Add screenshots
      screenshots.forEach((file, index) => {
        formData.append(`screenshot_${index}`, file)
      })

      const response = await fetch("/api/bug-report", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Senden")
      }

      toast.success("Bug-Report gesendet!", {
        description: "Vielen Dank für deine Meldung. Wir schauen uns das an.",
      })

      // Reset form
      form.reset()
      setScreenshots([])
      onOpenChange(false)
    } catch (error) {
      toast.error("Fehler beim Senden", {
        description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bug melden</DialogTitle>
          <DialogDescription>
            Beschreibe den Fehler so genau wie möglich. Je mehr Infos, desto schneller können wir helfen.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Kurze Beschreibung des Problems"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bereich *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="In welchem Bereich tritt der Fehler auf?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {areaOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Was ist passiert? *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beschreibe was du gemacht hast und was passiert ist..."
                      className="min-h-[100px] resize-none"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Schritt für Schritt: Was hast du geklickt? Was wurde angezeigt?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workedBefore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hat das vorher funktioniert?</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Ja, bis gestern ging es noch"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedBehavior"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Was hättest du erwartet?</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Die Route sollte gespeichert werden"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="screencastUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Screencast-Video (optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.loom.com/share/..."
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link zu Loom, YouTube oder anderem Video
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Screenshot Upload */}
            <div className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Screenshots (optional, max. 3)
              </FormLabel>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {screenshots.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {screenshots.map((file, index) => (
                    <div
                      key={index}
                      className="relative group bg-muted rounded-md p-2 flex items-center gap-2"
                    >
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeScreenshot(index)}
                        className="p-1 hover:bg-destructive/10 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {screenshots.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Screenshot hinzufügen
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                JPG, PNG oder WebP. Max. 5MB pro Bild.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Bug melden
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
