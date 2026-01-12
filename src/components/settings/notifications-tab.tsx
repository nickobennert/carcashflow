"use client"

import { useState } from "react"
import { Bell, Mail, MessageSquare, Car, Megaphone, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
    <div className="space-y-6">
      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Benachrichtigungskanäle</CardTitle>
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
          />

          <Separator />

          <NotificationRow
            icon={Bell}
            title="Push-Benachrichtigungen"
            description="Erhalte Benachrichtigungen direkt im Browser"
            checked={preferences.push}
            onCheckedChange={(checked) => updatePreference("push", checked)}
            isLoading={isLoading === "push"}
          />
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Benachrichtigungstypen</CardTitle>
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
          />

          <Separator />

          <NotificationRow
            icon={Car}
            title="Passende Fahrten"
            description="Wenn eine neue Fahrt zu deiner Route passt"
            checked={preferences.new_ride}
            onCheckedChange={(checked) => updatePreference("new_ride", checked)}
            isLoading={isLoading === "new_ride"}
          />

          <Separator />

          <NotificationRow
            icon={Megaphone}
            title="Marketing & Updates"
            description="Neuigkeiten und Tipps zu Carcashflow"
            checked={preferences.marketing}
            onCheckedChange={(checked) => updatePreference("marketing", checked)}
            isLoading={isLoading === "marketing"}
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
  )
}

function NotificationRow({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  isLoading,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  isLoading: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <Label className="text-base font-medium">{title}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}
