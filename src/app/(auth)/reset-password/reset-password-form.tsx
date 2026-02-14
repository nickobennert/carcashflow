"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { motion } from "motion/react"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { fadeIn } from "@/lib/animations"

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Passwort muss Groß-, Kleinbuchstaben und eine Zahl enthalten"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  const supabase = createClient()

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // Check if user has a valid recovery session
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()

      // User should have a session from the recovery link
      if (session) {
        setIsValidSession(true)
      } else {
        setIsValidSession(false)
      }
    }

    checkSession()
  }, [supabase.auth])

  async function onSubmit(data: ResetPasswordFormValues) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        if (error.message.includes("same as")) {
          toast.error("Gleiches Passwort", {
            description: "Das neue Passwort muss sich vom alten unterscheiden.",
          })
        } else {
          toast.error("Fehler beim Speichern", {
            description: error.message,
          })
        }
        return
      }

      setIsSuccess(true)
      toast.success("Passwort erfolgreich geändert!")

      // Redirect after short delay
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 2000)
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Wird geladen...</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Invalid or expired link
  if (isValidSession === false) {
    return (
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">Link ungültig oder abgelaufen</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Der Link zum Zurücksetzen deines Passworts ist abgelaufen oder wurde bereits verwendet.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-3">
            <Button asChild className="w-full">
              <Link href="/forgot-password">Neuen Link anfordern</Link>
            </Button>
            <Link href="/login" className="text-sm text-primary hover:underline">
              Zurück zur Anmeldung
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="rounded-full bg-offer/10 p-3">
                <CheckCircle className="h-10 w-10 text-offer" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-lg">Passwort geändert!</p>
                <p className="text-sm text-muted-foreground">
                  Du wirst weitergeleitet...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div variants={fadeIn} initial="initial" animate="animate">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neues Passwort</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        autoComplete="new-password"
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort bestätigen</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Passwort speichern
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Zurück zur Anmeldung
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
