"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Calendar, Camera, GraduationCap, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Profile } from "@/types"

const profileSchema = z.object({
  first_name: z.string().min(1, "Vorname ist erforderlich").max(50),
  last_name: z.string().max(50).optional(),
  username: z
    .string()
    .min(3, "Mindestens 3 Zeichen")
    .max(30, "Maximal 30 Zeichen")
    .regex(/^[a-z0-9_]+$/, "Nur Kleinbuchstaben, Zahlen und Unterstriche"),
  city: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  training_location: z.string().max(200).optional(),
  training_date: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileTabProps {
  profile: Profile
  onUpdate: (profile: Profile) => void
}

export function ProfileTab({ profile, onUpdate }: ProfileTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      username: profile.username || "",
      city: profile.city || "",
      phone: profile.phone || "",
      training_location: profile.training_location || "",
      training_date: profile.training_date || "",
    },
  })

  const initials = profile.first_name
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ""}`
    : profile.username?.[0]?.toUpperCase() || "?"

  async function onSubmit(data: ProfileFormData) {
    setIsLoading(true)

    try {
      const { data: updated, error } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name,
          last_name: data.last_name || null,
          username: data.username,
          city: data.city || null,
          phone: data.phone || null,
          training_location: data.training_location || null,
          training_date: data.training_date || null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", profile.id)
        .select()
        .single()

      if (error) {
        if (error.code === "23505") {
          toast.error("Dieser Benutzername ist bereits vergeben")
        } else {
          throw error
        }
        return
      }

      onUpdate(updated as Profile)
      toast.success("Profil aktualisiert")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Fehler beim Aktualisieren des Profils")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Bitte wähle ein Bild aus")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Das Bild darf maximal 2MB groß sein")
      return
    }

    setIsUploadingAvatar(true)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Update profile
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl } as never)
        .eq("id", profile.id)
        .select()
        .single()

      if (updateError) throw updateError

      onUpdate(updated as Profile)
      toast.success("Profilbild aktualisiert")
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast.error("Fehler beim Hochladen des Bildes")
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function handleRemoveAvatar() {
    if (!profile.avatar_url) return

    setIsUploadingAvatar(true)

    try {
      // Extract file path from URL to delete from storage
      const url = new URL(profile.avatar_url)
      const pathMatch = url.pathname.match(/\/avatars\/(.+)$/)

      if (pathMatch) {
        const filePath = `avatars/${pathMatch[1]}`
        // Delete from storage (ignore errors - file might not exist)
        await supabase.storage.from("avatars").remove([filePath])
      }

      // Update profile to remove avatar_url
      const { data: updated, error } = await supabase
        .from("profiles")
        .update({ avatar_url: null } as never)
        .eq("id", profile.id)
        .select()
        .single()

      if (error) throw error

      onUpdate(updated as Profile)
      toast.success("Profilbild entfernt")
    } catch (error) {
      console.error("Error removing avatar:", error)
      toast.error("Fehler beim Entfernen des Bildes")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profilbild</CardTitle>
          <CardDescription>
            Dein Profilbild wird anderen Nutzern angezeigt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  Bild hochladen
                </Button>
                {profile.avatar_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Entfernen
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG oder GIF. Max. 2MB.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Persönliche Daten</CardTitle>
          <CardDescription>
            Diese Informationen werden anderen Nutzern angezeigt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorname</FormLabel>
                      <FormControl>
                        <Input placeholder="Max" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nachname</FormLabel>
                      <FormControl>
                        <Input placeholder="Mustermann" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benutzername</FormLabel>
                    <FormControl>
                      <Input placeholder="max_mustermann" {...field} />
                    </FormControl>
                    <FormDescription>
                      Dein eindeutiger Benutzername in der App
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wohnort</FormLabel>
                      <FormControl>
                        <Input placeholder="Köln" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="+49 123 456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Training Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="training_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Schulungsort
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. München" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ort deiner Schulung
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="training_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Schulungsdatum
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Startdatum deiner Schulung
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Speichern
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
