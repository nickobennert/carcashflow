"use client"

import { useState } from "react"
import {
  Eye,
  EyeOff,
  Download,
  FileText,
  Loader2,
  Shield,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
import type { Profile } from "@/types"

interface PrivacyTabProps {
  profile: Profile
  onUpdate: (profile: Profile) => void
}

export function PrivacyTab({ profile, onUpdate }: PrivacyTabProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const supabase = createClient()

  const isPublic = profile.is_public ?? true

  async function toggleVisibility() {
    setIsLoading("visibility")

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          is_public: !isPublic,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", profile.id)
        .select()
        .single()

      if (error) throw error

      onUpdate(data as Profile)
      toast.success(
        isPublic
          ? "Dein Profil ist jetzt privat"
          : "Dein Profil ist jetzt öffentlich"
      )
    } catch (error) {
      console.error("Error updating visibility:", error)
      toast.error("Fehler beim Aktualisieren der Sichtbarkeit")
    } finally {
      setIsLoading(null)
    }
  }

  async function handleExportData() {
    setIsExporting(true)

    try {
      // Fetch all user data
      const [profileData, ridesData, messagesData, conversationsData] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", profile.id).single(),
          supabase.from("rides").select("*").eq("user_id", profile.id),
          supabase.from("messages").select("*").eq("sender_id", profile.id),
          supabase
            .from("conversation_participants")
            .select("*, conversations(*)")
            .eq("user_id", profile.id),
        ])

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: profileData.data,
        rides: ridesData.data,
        messages: messagesData.data,
        conversations: conversationsData.data,
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `carcashflow-export-${profile.username}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Daten erfolgreich exportiert")
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("Fehler beim Exportieren der Daten")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Profil-Sichtbarkeit
          </CardTitle>
          <CardDescription>
            Kontrolliere, wer dein Profil und deine Aktivitäten sehen kann
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {isPublic ? (
                <Eye className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div>
                <Label className="text-base font-medium">
                  Öffentliches Profil
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isPublic
                    ? "Dein Profil ist für alle Nutzer sichtbar"
                    : "Nur verbundene Nutzer können dein Profil sehen"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLoading === "visibility" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <Switch
                checked={isPublic}
                onCheckedChange={toggleVisibility}
                disabled={isLoading === "visibility"}
              />
            </div>
          </div>

          <Separator />

          {/* Visibility Details */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Was ist sichtbar?</p>

            <div className="grid gap-3">
              <VisibilityRow
                label="Profilbild & Name"
                publicVisible
                privateVisible
              />
              <VisibilityRow
                label="Bio & Stadt"
                publicVisible
                privateVisible={false}
              />
              <VisibilityRow
                label="Aktive Routen"
                publicVisible
                privateVisible={false}
              />
              <VisibilityRow
                label="Schulungsort"
                publicVisible
                privateVisible={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-muted-foreground" />
            Daten exportieren
          </CardTitle>
          <CardDescription>
            Lade eine Kopie aller deiner Daten herunter (DSGVO Art. 20)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>Der Export enthält:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Deine Profildaten</li>
                <li>Alle erstellten Routen</li>
                <li>Deine Nachrichten</li>
                <li>Verbindungen zu anderen Nutzern</li>
              </ul>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Daten als JSON exportieren
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Daten exportieren?</AlertDialogTitle>
                <AlertDialogDescription>
                  Es wird eine JSON-Datei mit all deinen Daten erstellt und
                  heruntergeladen. Dies kann einen Moment dauern.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleExportData}>
                  Exportieren
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Privacy Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Deine Daten sind sicher</p>
              <p className="text-sm text-muted-foreground mt-1">
                Wir speichern deine Daten sicher in der EU und geben sie nicht
                an Dritte weiter. Mehr dazu in unserer{" "}
                <a href="/privacy" className="underline hover:text-foreground">
                  Datenschutzerklärung
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function VisibilityRow({
  label,
  publicVisible,
  privateVisible,
}: {
  label: string
  publicVisible: boolean
  privateVisible: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs">
          <Eye className="h-3.5 w-3.5" />
          {publicVisible ? (
            <span className="text-emerald-600">Sichtbar</span>
          ) : (
            <span className="text-muted-foreground">Versteckt</span>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <EyeOff className="h-3.5 w-3.5" />
          {privateVisible ? (
            <span className="text-emerald-600">Sichtbar</span>
          ) : (
            <span className="text-muted-foreground">Versteckt</span>
          )}
        </span>
      </div>
    </div>
  )
}
