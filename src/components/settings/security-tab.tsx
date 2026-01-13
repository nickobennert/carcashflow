"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  Shield,
  Smartphone,
  Monitor,
  Globe,
  Loader2,
  HelpCircle,
  Trash2,
  Clock,
  MapPin,
  AlertCircle,
  Languages,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Profile } from "@/types"

interface Session {
  id: string
  device: string
  browser: string
  location: string
  lastActive: Date
  isCurrent: boolean
}

interface SecurityTabProps {
  profile: Profile
  onUpdate: (profile: Profile) => void
}

export function SecurityTab({ profile, onUpdate }: SecurityTabProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTerminating, setIsTerminating] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState("de")
  const supabase = createClient()

  // Simulate loading sessions (in real app, this would come from Supabase auth sessions)
  useEffect(() => {
    async function loadSessions() {
      // In a real implementation, you would fetch active sessions from Supabase
      // For now, we simulate the current session
      const mockSessions: Session[] = [
        {
          id: "current",
          device: detectDevice(),
          browser: detectBrowser(),
          location: "Deutschland",
          lastActive: new Date(),
          isCurrent: true,
        },
      ]
      setSessions(mockSessions)
      setIsLoading(false)
    }

    loadSessions()
  }, [])

  function detectDevice(): string {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""
    if (/Mobile|Android|iPhone|iPad/.test(ua)) {
      return "Mobilgerät"
    }
    return "Desktop"
  }

  function detectBrowser(): string {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""
    if (ua.includes("Chrome")) return "Chrome"
    if (ua.includes("Firefox")) return "Firefox"
    if (ua.includes("Safari")) return "Safari"
    if (ua.includes("Edge")) return "Edge"
    return "Unbekannt"
  }

  async function terminateSession(sessionId: string) {
    if (sessionId === "current") {
      toast.error("Du kannst deine aktuelle Sitzung nicht beenden")
      return
    }

    setIsTerminating(sessionId)

    try {
      // In real implementation: revoke the session token
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      toast.success("Sitzung beendet")
    } catch (error) {
      console.error("Error terminating session:", error)
      toast.error("Fehler beim Beenden der Sitzung")
    } finally {
      setIsTerminating(null)
    }
  }

  async function terminateAllOtherSessions() {
    setIsTerminating("all")

    try {
      // Sign out from all other devices
      // Note: Supabase doesn't have a built-in method for this yet
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSessions((prev) => prev.filter((s) => s.isCurrent))
      toast.success("Alle anderen Sitzungen beendet")
    } catch (error) {
      console.error("Error terminating sessions:", error)
      toast.error("Fehler beim Beenden der Sitzungen")
    } finally {
      setIsTerminating(null)
    }
  }

  async function handleLanguageChange(language: string) {
    setSelectedLanguage(language)

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          language_preference: language,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", profile.id)
        .select()
        .single()

      if (error) throw error

      onUpdate(data as Profile)
      toast.success("Sprache geändert")
    } catch (error) {
      console.error("Error updating language:", error)
      toast.error("Fehler beim Ändern der Sprache")
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Sprache</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  Ändere die Anzeigesprache der App
                </TooltipContent>
              </Tooltip>
            </div>
            <CardDescription>
              Wähle deine bevorzugte Sprache für die Benutzeroberfläche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Anzeigesprache</Label>
                <p className="text-sm text-muted-foreground">
                  Die Sprache, in der die App angezeigt wird
                </p>
              </div>
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">
                    <span className="flex items-center gap-2">
                      🇩🇪 Deutsch
                    </span>
                  </SelectItem>
                  <SelectItem value="en" disabled>
                    <span className="flex items-center gap-2">
                      🇬🇧 English (Coming Soon)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Aktive Sitzungen</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Hier siehst du alle Geräte, auf denen du angemeldet bist.
                    Du kannst einzelne Sitzungen beenden.
                  </TooltipContent>
                </Tooltip>
              </div>
              {sessions.filter((s) => !s.isCurrent).length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Alle anderen beenden
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Alle anderen Sitzungen beenden?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Du wirst auf allen anderen Geräten abgemeldet.
                        Nur diese aktuelle Sitzung bleibt bestehen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={terminateAllOtherSessions}
                        disabled={isTerminating === "all"}
                      >
                        {isTerminating === "all" && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Alle beenden
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <CardDescription>
              Verwalte die Geräte, auf denen du angemeldet bist
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Keine aktiven Sitzungen gefunden
              </p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session, index) => (
                  <div key={session.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {session.device === "Mobilgerät" ? (
                          <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        ) : (
                          <Monitor className="h-5 w-5 text-muted-foreground mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {session.browser} auf {session.device}
                            </p>
                            {session.isCurrent && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aktuell
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {session.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {session.isCurrent
                                ? "Gerade aktiv"
                                : format(session.lastActive, "d. MMM yyyy, HH:mm", {
                                    locale: de,
                                  })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => terminateSession(session.id)}
                          disabled={isTerminating === session.id}
                        >
                          {isTerminating === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Sicherheitstipps</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Melde dich ab, wenn du öffentliche Computer nutzt</li>
                  <li>• Ändere dein Passwort regelmäßig</li>
                  <li>• Verwende ein starkes, einzigartiges Passwort</li>
                  <li>• Beende unbekannte Sitzungen sofort</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Features */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Bald verfügbar:</strong> Zwei-Faktor-Authentifizierung (2FA)
            für zusätzliche Sicherheit.
          </AlertDescription>
        </Alert>
      </div>
    </TooltipProvider>
  )
}
