"use client"

import { useState } from "react"
import {
  Download,
  FileText,
  FileJson,
  Loader2,
  Shield,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Profile } from "@/types"

interface PrivacyTabProps {
  profile: Profile
  onUpdate: (profile: Profile) => void
}

type ExportFormat = "json" | "csv"

export function PrivacyTab({ profile }: PrivacyTabProps) {
  const [isExporting, setIsExporting] = useState(false)
  const supabase = createClient()

  async function fetchExportData() {
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

    return {
      exportedAt: new Date().toISOString(),
      profile: profileData.data,
      rides: ridesData.data || [],
      messages: messagesData.data || [],
      conversations: conversationsData.data || [],
      legalAcceptances: legalData.data || [],
    }
  }

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function convertToCSV(data: Record<string, unknown>[]): string {
    if (data.length === 0) return ""
    const headers = Object.keys(data[0])
    const rows = data.map((row) =>
      headers
        .map((header) => {
          const val = row[header]
          if (val === null || val === undefined) return ""
          if (typeof val === "object") return JSON.stringify(val).replace(/"/g, '""')
          return String(val).replace(/"/g, '""')
        })
        .map((v) => `"${v}"`)
        .join(",")
    )
    return [headers.join(","), ...rows].join("\n")
  }

  async function handleExportData(format: ExportFormat) {
    setIsExporting(true)

    try {
      const exportData = await fetchExportData()
      const timestamp = Date.now()
      const baseFilename = `fahrmit-export-${profile.username}-${timestamp}`

      switch (format) {
        case "json": {
          const content = JSON.stringify(exportData, null, 2)
          downloadFile(content, `${baseFilename}.json`, "application/json")
          break
        }
        case "csv": {
          // Export all data as CSV
          const csvContent = convertToCSV(exportData.rides as Record<string, unknown>[])
          downloadFile(csvContent || "Keine Routen vorhanden", `${baseFilename}.csv`, "text/csv")
          break
        }
      }

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Daten exportieren
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuItem onClick={() => handleExportData("json")}>
                <FileJson className="mr-2 h-4 w-4" />
                Als JSON exportieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportData("csv")}>
                <FileText className="mr-2 h-4 w-4" />
                Als CSV exportieren
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
