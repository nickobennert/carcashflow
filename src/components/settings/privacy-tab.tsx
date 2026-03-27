"use client"

import { useState } from "react"
import {
  Download,
  Loader2,
  Shield,
  Info,
  FileText,
  ScrollText,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UsageRulesContent } from "@/components/legal/usage-rules-content"
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content"
import type { Profile } from "@/types"

interface PrivacyTabProps {
  profile: Profile
  onUpdate: (profile: Profile) => void
}

export function PrivacyTab({ profile }: PrivacyTabProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  async function handleExportData() {
    setIsExporting(true)

    try {
      // Use server-side API endpoint for complete data export (DSGVO Article 20)
      const response = await fetch("/api/settings/export-data")

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Exportieren")
      }

      // Get the blob and trigger download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fahrmit-datenexport-${profile.username}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Daten erfolgreich exportiert")
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Exportieren der Daten")
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
              <p>Der Export enthält alle deine personenbezogenen Daten:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Deine Profildaten</li>
                <li>Alle erstellten Routen</li>
                <li>Deine Konversationen und Nachrichten</li>
                <li>Gespeicherte Routen-Benachrichtigungen</li>
                <li>Rechtliche Zustimmungen</li>
                <li>Benachrichtigungen</li>
              </ul>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={isExporting}
            onClick={handleExportData}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Daten als JSON exportieren
          </Button>
        </CardContent>
      </Card>

      {/* Legal Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-muted-foreground" />
            Rechtliches
          </CardTitle>
          <CardDescription>
            Nutzungsregeln und Datenschutzerklärung einsehen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => setShowRules(true)}
          >
            <FileText className="h-4 w-4" />
            Nutzungsregeln anzeigen
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => setShowPrivacy(true)}
          >
            <Shield className="h-4 w-4" />
            Datenschutzerklärung anzeigen
          </Button>
        </CardContent>
      </Card>

      {/* Usage Rules Dialog */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Regeln für die Nutzung der FAHR MIT App</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] rounded-lg border bg-muted/30 p-4">
            <UsageRulesContent />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Datenschutzerklärung</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] rounded-lg border bg-muted/30 p-4">
            <PrivacyPolicyContent />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
