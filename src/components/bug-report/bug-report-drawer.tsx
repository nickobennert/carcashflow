"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { motion, AnimatePresence } from "motion/react"
import {
  Bug,
  X,
  Loader2,
  Upload,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  MessageSquare,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import type { BugReportWithUser, BugReportStatus } from "@/types"

const AREAS = [
  { value: "dashboard", label: "Dashboard / Routen" },
  { value: "messages", label: "Nachrichten" },
  { value: "profile", label: "Profil" },
  { value: "settings", label: "Einstellungen" },
  { value: "other", label: "Sonstiges" },
]

const bugReportSchema = z.object({
  title: z.string().min(3, "Mindestens 3 Zeichen").max(100, "Maximal 100 Zeichen"),
  description: z.string().min(10, "Bitte beschreibe das Problem genauer").max(1000, "Maximal 1000 Zeichen"),
  area: z.enum(["dashboard", "messages", "profile", "settings", "other"]),
})

type BugReportFormValues = z.infer<typeof bugReportSchema>

export function BugReportDrawer() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [reports, setReports] = useState<BugReportWithUser[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loadingReports, setLoadingReports] = useState(false)
  const [selectedReport, setSelectedReport] = useState<BugReportWithUser | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; report: BugReportWithUser | null }>({
    open: false,
    report: null,
  })
  const [activeTab, setActiveTab] = useState<"new" | "list">("new")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<BugReportFormValues>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      title: "",
      description: "",
      area: "other",
    },
  })

  // Auto-detect area based on current pathname
  useEffect(() => {
    if (pathname.startsWith("/dashboard")) {
      form.setValue("area", "dashboard")
    } else if (pathname.startsWith("/messages")) {
      form.setValue("area", "messages")
    } else if (pathname.startsWith("/profile")) {
      form.setValue("area", "profile")
    } else if (pathname.startsWith("/settings")) {
      form.setValue("area", "settings")
    }
  }, [pathname, form])

  const loadReports = useCallback(async () => {
    setLoadingReports(true)
    try {
      const response = await fetch("/api/bug-reports")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setReports(data.data || [])
      setIsAdmin(data.isAdmin || false)
    } catch (error) {
      console.error("Error loading reports:", error)
    } finally {
      setLoadingReports(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadReports()
    }
  }, [open, loadReports])

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Bitte nur Bilder hochladen")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maximale Dateigröße: 5MB")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/bug-reports/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()
      setScreenshot(data.url)
      toast.success("Screenshot hochgeladen")
    } catch (error) {
      console.error("Error uploading:", error)
      toast.error("Fehler beim Hochladen")
    } finally {
      setIsUploading(false)
    }
  }

  async function onSubmit(data: BugReportFormValues) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          screenshot_url: screenshot,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit")
      }

      toast.success("Feedback gesendet! Vielen Dank.")
      form.reset()
      setScreenshot(null)
      loadReports()
      setActiveTab("list")
    } catch (error) {
      console.error("Error submitting:", error)
      toast.error("Fehler beim Senden")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStatusChange(reportId: string, status: BugReportStatus) {
    try {
      const response = await fetch(`/api/bug-reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast.success(status === "resolved" ? "Als erledigt markiert" : "Status aktualisiert")
      loadReports()
      setSelectedReport(null)
    } catch (error) {
      console.error("Error updating:", error)
      toast.error("Fehler beim Aktualisieren")
    }
  }

  async function handleDelete(report: BugReportWithUser) {
    try {
      const response = await fetch(`/api/bug-reports/${report.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      toast.success("Bug-Report gelöscht")
      loadReports()
      setDeleteDialog({ open: false, report: null })
      setSelectedReport(null)
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Fehler beim Löschen")
    }
  }

  function getStatusBadge(status: BugReportStatus) {
    switch (status) {
      case "open":
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Offen
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="secondary" className="gap-1 bg-blue-500 text-white">
            <Clock className="h-3 w-3" />
            In Bearbeitung
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="secondary" className="gap-1 bg-emerald-500 text-white">
            <CheckCircle className="h-3 w-3" />
            Erledigt
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="secondary" className="gap-1 bg-muted text-muted-foreground">
            Geschlossen
          </Badge>
        )
    }
  }

  function getAreaLabel(area: string) {
    return AREAS.find((a) => a.value === area)?.label || area
  }

  function handleClose() {
    setOpen(false)
    setSelectedReport(null)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-colors"
            title="Bug melden / Feedback geben"
          >
            <Bug className="h-5 w-5" />
          </motion.button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 m-4 h-[calc(100vh-2rem)] rounded-lg border shadow-2xl flex flex-col [&>button]:hidden"
        >
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bug className="h-5 w-5 text-primary" />
                <SheetTitle className="text-xl">Feedback & Bugs</SheetTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SheetDescription>
              Hilf uns die App zu verbessern!
            </SheetDescription>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "new" | "list")} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mx-6 mt-4 max-w-[calc(100%-3rem)]">
                <TabsTrigger value="new">Neues Feedback</TabsTrigger>
                <TabsTrigger value="list" className="gap-1">
                  Meine Meldungen
                  {reports.filter((r) => r.status === "open").length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {reports.filter((r) => r.status === "open").length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titel</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Kurze Beschreibung des Problems..."
                              {...field}
                              disabled={isLoading}
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
                          <FormLabel>Bereich</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Bereich auswählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {AREAS.map((area) => (
                                <SelectItem key={area.value} value={area.value}>
                                  {area.label}
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
                          <FormLabel>Beschreibung</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Beschreibe das Problem so genau wie möglich. Was hast du erwartet? Was ist passiert?"
                              rows={4}
                              className="resize-none"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/1000 Zeichen
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Screenshot Upload */}
                    <div className="space-y-2">
                      <FormLabel>Screenshot (optional)</FormLabel>
                      {screenshot ? (
                        <div className="relative rounded-lg border overflow-hidden">
                          <img
                            src={screenshot}
                            alt="Screenshot"
                            className="w-full h-32 object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => setScreenshot(null)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors",
                            isUploading && "opacity-50 pointer-events-none"
                          )}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {isUploading ? (
                            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Klicke oder ziehe ein Bild hierher
                              </p>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Feedback senden
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="list" className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
                {loadingReports ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Noch keine Meldungen</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {reports.map((report) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className={cn(
                            "p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedReport?.id === report.id && "ring-2 ring-primary"
                          )}
                          onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-medium text-sm line-clamp-1">{report.title}</h4>
                            {getStatusBadge(report.status)}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span>{getAreaLabel(report.area)}</span>
                            <span>•</span>
                            <span>{format(new Date(report.created_at), "dd.MM.yy", { locale: de })}</span>
                          </div>

                          {isAdmin && report.profiles && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={report.profiles.avatar_url || undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {report.profiles.first_name?.[0] || report.profiles.username[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {report.profiles.first_name || report.profiles.username}
                              </span>
                            </div>
                          )}

                          {/* Expanded View */}
                          <AnimatePresence>
                            {selectedReport?.id === report.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t space-y-3"
                              >
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {report.description}
                                </p>

                                {report.screenshot_url && (
                                  <a
                                    href={report.screenshot_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <img
                                      src={report.screenshot_url}
                                      alt="Screenshot"
                                      className="w-full h-32 object-cover rounded-lg border"
                                    />
                                    <span className="text-xs text-primary flex items-center gap-1 mt-1">
                                      <ExternalLink className="h-3 w-3" />
                                      Screenshot öffnen
                                    </span>
                                  </a>
                                )}

                                {isAdmin && (
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    {report.status !== "resolved" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 text-emerald-600 hover:text-emerald-700"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleStatusChange(report.id, "resolved")
                                        }}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Erledigt
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-destructive hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setDeleteDialog({ open: true, report })
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Löschen
                                    </Button>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, report: null })
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bug-Report löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Bug-Report und der zugehörige Screenshot werden dauerhaft gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteDialog.report && handleDelete(deleteDialog.report)}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
