"use client"

import { useState } from "react"
import {
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

export function PrivacyTab({ profile }: PrivacyTabProps) {
  const [isExporting, setIsExporting] = useState(false)
  const supabase = createClient()

  async function handleExportData() {
    setIsExporting(true)

    try {
      // Fetch all user data
      const [profileData, ridesData, messagesData, conversationsData, legalData] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", profile.id).single(),
          supabase.from("rides").select("*").eq("user_id", profile.id),
          supabase.from("messages").select("*").eq("sender_id", profile.id),
          supabase
            .from("conversation_participants")
            .select("*, conversations(*)")
            .eq("user_id", profile.id),
          supabase
            .from("legal_acceptances")
            .select("*")
            .eq("user_id", profile.id),
        ])

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: profileData.data,
        rides: ridesData.data,
        messages: messagesData.data,
        conversations: conversationsData.data,
        legalAcceptances: legalData.data,
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
                <li>Konversationen</li>
                <li>Rechtliche Zustimmungen</li>
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
                <a href="/datenschutz" className="underline hover:text-foreground">
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
