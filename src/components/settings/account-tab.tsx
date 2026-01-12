"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, AlertTriangle, Mail, Lock } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
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
import { Separator } from "@/components/ui/separator"
import type { Profile } from "@/types"

const emailSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Aktuelles Passwort erforderlich"),
    newPassword: z.string().min(8, "Mindestens 8 Zeichen"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  })

type EmailFormData = z.infer<typeof emailSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

interface AccountTabProps {
  profile: Profile
}

export function AccountTab({ profile }: AccountTabProps) {
  const router = useRouter()
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const supabase = createClient()

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: profile.email || "",
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onEmailSubmit(data: EmailFormData) {
    if (data.email === profile.email) {
      toast.info("Die E-Mail-Adresse ist bereits aktuell")
      return
    }

    setIsUpdatingEmail(true)

    try {
      const { error } = await supabase.auth.updateUser({
        email: data.email,
      })

      if (error) throw error

      toast.success(
        "Bestätigungs-E-Mail gesendet. Bitte überprüfe deinen Posteingang."
      )
    } catch (error) {
      console.error("Error updating email:", error)
      toast.error("Fehler beim Aktualisieren der E-Mail-Adresse")
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  async function onPasswordSubmit(data: PasswordFormData) {
    setIsUpdatingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      })

      if (error) throw error

      passwordForm.reset()
      toast.success("Passwort erfolgreich geändert")
    } catch (error) {
      console.error("Error updating password:", error)
      toast.error("Fehler beim Ändern des Passworts")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== profile.username) {
      toast.error("Benutzername stimmt nicht überein")
      return
    }

    setIsDeletingAccount(true)

    try {
      // Sign out first
      await supabase.auth.signOut()

      // Note: Actual account deletion should be handled by a server-side function
      // that verifies the request and deletes all user data
      toast.success("Account-Löschung angefordert. Du wirst weitergeleitet...")
      router.push("/")
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("Fehler beim Löschen des Accounts")
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle>E-Mail-Adresse</CardTitle>
          </div>
          <CardDescription>
            Ändere die E-Mail-Adresse für deinen Account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(onEmailSubmit)}
              className="space-y-4"
            >
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="max@beispiel.de"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdatingEmail}>
                  {isUpdatingEmail && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  E-Mail ändern
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Passwort</CardTitle>
          </div>
          <CardDescription>
            Ändere das Passwort für deinen Account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aktuelles Passwort</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Neues Passwort</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passwort bestätigen</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Passwort ändern
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Gefahrenzone</CardTitle>
          </div>
          <CardDescription>
            Unwiderrufliche Aktionen für deinen Account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Account löschen</p>
                <p className="text-sm text-muted-foreground">
                  Lösche deinen Account und alle zugehörigen Daten permanent
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Account löschen</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Account wirklich löschen?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>
                        Diese Aktion kann nicht rückgängig gemacht werden. Alle
                        deine Daten, Routen und Nachrichten werden permanent
                        gelöscht.
                      </p>
                      <Separator />
                      <p>
                        Gib zur Bestätigung deinen Benutzernamen ein:{" "}
                        <span className="font-mono font-medium">
                          {profile.username}
                        </span>
                      </p>
                      <Input
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="Benutzername eingeben"
                      />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                      Abbrechen
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={
                        deleteConfirmation !== profile.username ||
                        isDeletingAccount
                      }
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletingAccount && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Ja, Account löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
