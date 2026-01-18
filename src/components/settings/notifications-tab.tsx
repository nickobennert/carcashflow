"use client"

import { useState } from "react"
import { Bell, Mail, MessageSquare, Car, Megaphone, Loader2, HelpCircle } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Profile } from "@/types"

interface NotificationPreferences {
  email: boolean
  push: boolean
  new_message: boolean
  new_ride: boolean
  marketing: boolean
}

interface NotificationsTabProps {
  profile: Profile
  onUpdate: (profile: Profile) => void
}

export function NotificationsTab({ profile, onUpdate }: NotificationsTabProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const supabase = createClient()

  const preferences: NotificationPreferences = {
    email: true,
    push: true,
    new_message: true,
    new_ride: false,
    marketing: false,
    ...(profile.notification_preferences as Partial<NotificationPreferences> || {}),
  }

  async function updatePreference(key: keyof NotificationPreferences, value: boolean) {
    setIsLoading(key)

    try {
      const newPreferences = {
        ...preferences,
        [key]: value,
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          notification_preferences: newPreferences,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", profile.id)
        .select()
        .single()

      if (error) throw error

      onUpdate(data as Profile)
      toast.success("Einstellung gespeichert")
    } catch (error) {
      console.error("Error updating notification preferences:", error)
      toast.error("Fehler beim Speichern")
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Benachrichtigungskanäle</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  Wähle wie du benachrichtigt werden möchtest
                </TooltipContent>
              </Tooltip>
            </div>
            <CardDescription>
              Wähle aus, über welche Kanäle du Benachrichtigungen erhalten möchtest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <NotificationRow
              icon={Mail}
              title="E-Mail-Benachrichtigungen"
              description="Erhalte wichtige Updates per E-Mail"
              checked={preferences.email}
              onCheckedChange={(checked) => updatePreference("email", checked)}
              isLoading={isLoading === "email"}
              comingSoon
              tooltip="E-Mails werden bei neuen Nachrichten und wichtigen Updates versendet"
            />

            <Separator />

            <NotificationRow
              icon={Bell}
              title="In-App-Benachrichtigungen"
              description="Benachrichtigungen direkt in der App"
              checked={preferences.push}
              onCheckedChange={(checked) => updatePreference("push", checked)}
              isLoading={isLoading === "push"}
              tooltip="Du siehst Badges und Hinweise wenn du die App nutzt"
            />
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Benachrichtigungstypen</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  Bestimme bei welchen Ereignissen du informiert wirst
                </TooltipContent>
              </Tooltip>
            </div>
            <CardDescription>
              Entscheide, bei welchen Ereignissen du benachrichtigt werden möchtest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <NotificationRow
              icon={MessageSquare}
              title="Neue Nachrichten"
              description="Wenn du eine neue Nachricht erhältst"
              checked={preferences.new_message}
              onCheckedChange={(checked) => updatePreference("new_message", checked)}
              isLoading={isLoading === "new_message"}
              tooltip="Erhalte sofort eine Benachrichtigung wenn jemand dir schreibt"
            />

            <Separator />

            <NotificationRow
              icon={Car}
              title="Passende Fahrten"
              description="Wenn eine neue Fahrt zu deiner Route passt"
              checked={preferences.new_ride}
              onCheckedChange={(checked) => updatePreference("new_ride", checked)}
              isLoading={isLoading === "new_ride"}
              comingSoon
              tooltip="Automatische Benachrichtigung wenn eine passende Fahrt erstellt wird"
            />

            <Separator />

            <NotificationRow
              icon={Megaphone}
              title="Marketing & Updates"
              description="Neuigkeiten und Tipps zu Fahr mit!"
              checked={preferences.marketing}
              onCheckedChange={(checked) => updatePreference("marketing", checked)}
              isLoading={isLoading === "marketing"}
              tooltip="Erhalte gelegentlich News über neue Features und Verbesserungen"
            />
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Wichtige Hinweise</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Transaktionale E-Mails (z.B. Passwort zurücksetzen, Account-Bestätigung)
                  werden unabhängig von diesen Einstellungen immer gesendet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

function NotificationRow({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  isLoading,
  comingSoon,
  tooltip,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  isLoading: boolean
  comingSoon?: boolean
  tooltip?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">{title}</Label>
            {comingSoon && (
              <Badge variant="secondary" className="text-xs">
                Coming Soon
              </Badge>
            )}
            {tooltip && (
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={isLoading || comingSoon}
        />
      </div>
    </div>
  )
}
