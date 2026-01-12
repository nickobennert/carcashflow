"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { motion } from "motion/react"
import { Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { fadeIn } from "@/lib/animations"
import type { Profile } from "@/types"

const profileSetupSchema = z.object({
  username: z
    .string()
    .min(3, "Benutzername muss mindestens 3 Zeichen lang sein")
    .max(30, "Benutzername darf maximal 30 Zeichen lang sein")
    .regex(
      /^[a-z0-9_]+$/,
      "Nur Kleinbuchstaben, Zahlen und Unterstriche erlaubt"
    ),
  first_name: z
    .string()
    .min(2, "Vorname muss mindestens 2 Zeichen lang sein")
    .max(50, "Vorname darf maximal 50 Zeichen lang sein"),
  last_name: z
    .string()
    .max(50, "Nachname darf maximal 50 Zeichen lang sein")
    .optional(),
  city: z.string().max(100, "Stadt darf maximal 100 Zeichen lang sein").optional(),
  bio: z.string().max(500, "Bio darf maximal 500 Zeichen lang sein").optional(),
})

type ProfileSetupFormValues = z.infer<typeof profileSetupSchema>

interface ProfileSetupFormProps {
  userId: string
  email: string
  defaultFirstName: string
  existingProfile: Profile | null
}

export function ProfileSetupForm({
  userId,
  email,
  defaultFirstName,
  existingProfile,
}: ProfileSetupFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  const supabase = createClient()

  // Generate default username from email
  const generateUsername = () => {
    const emailPrefix = email.split("@")[0]
    const cleanPrefix = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, "_")
    const randomSuffix = Math.random().toString(36).substring(2, 6)
    return `${cleanPrefix}_${randomSuffix}`
  }

  const form = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      username: existingProfile?.username || generateUsername(),
      first_name: existingProfile?.first_name || defaultFirstName,
      last_name: existingProfile?.last_name || "",
      city: existingProfile?.city || "",
      bio: existingProfile?.bio || "",
    },
  })

  async function checkUsernameAvailability(username: string) {
    if (username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .neq("id", userId)
        .single()

      if (error && error.code === "PGRST116") {
        // No rows returned = username is available
        setUsernameAvailable(true)
      } else if (data) {
        setUsernameAvailable(false)
      }
    } catch {
      setUsernameAvailable(null)
    } finally {
      setCheckingUsername(false)
    }
  }

  async function onSubmit(data: ProfileSetupFormValues) {
    if (usernameAvailable === false) {
      toast.error("Benutzername bereits vergeben")
      return
    }

    setIsLoading(true)
    try {
      // Type cast to avoid strict typing issues with Supabase
      // The actual table structure will be created in Supabase
      const profileData = {
        id: userId,
        email: email,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name || null,
        city: data.city || null,
        bio: data.bio || null,
        trial_ends_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days trial
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData as never)
        .eq("id", userId)

      if (error) {
        if (error.code === "23505") {
          toast.error("Benutzername bereits vergeben")
          setUsernameAvailable(false)
        } else {
          toast.error("Fehler beim Speichern", {
            description: error.message,
          })
        }
        return
      }

      toast.success("Profil erfolgreich eingerichtet!")
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div variants={fadeIn} initial="initial" animate="animate">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              1
            </div>
            <span className="text-sm text-muted-foreground">
              Schritt 1 von 1
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benutzername</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="max_mustermann"
                          autoComplete="username"
                          disabled={isLoading}
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase()
                            field.onChange(value)
                            setUsernameAvailable(null)
                          }}
                          onBlur={(e) => {
                            field.onBlur()
                            checkUsernameAvailability(e.target.value)
                          }}
                        />
                        {checkingUsername && (
                          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                        {usernameAvailable === true && !checkingUsername && (
                          <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Dein öffentlicher Benutzername (z.B. carcashflow.de/u/
                      {field.value || "username"})
                    </FormDescription>
                    {usernameAvailable === false && (
                      <p className="text-sm font-medium text-destructive">
                        Benutzername bereits vergeben
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorname *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Max"
                          autoComplete="given-name"
                          disabled={isLoading}
                          {...field}
                        />
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
                        <Input
                          placeholder="Mustermann"
                          autoComplete="family-name"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wohnort</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="München"
                        autoComplete="address-level2"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Für besseres Routen-Matching</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Über mich</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Erzähle etwas über dich..."
                        className="resize-none"
                        rows={3}
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0}/500 Zeichen
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || usernameAvailable === false}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Profil speichern & loslegen
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
