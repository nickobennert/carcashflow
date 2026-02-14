"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { motion } from "motion/react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { fadeIn } from "@/lib/animations"

const signupSchema = z
  .object({
    first_name: z
      .string()
      .min(2, "Vorname muss mindestens 2 Zeichen lang sein")
      .max(50, "Vorname darf maximal 50 Zeichen lang sein"),
    email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
    password: z
      .string()
      .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Passwort muss Groß-, Kleinbuchstaben und eine Zahl enthalten"
      ),
    confirmPassword: z.string(),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: "Du musst die Nutzungsbedingungen akzeptieren",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const supabase = createClient()

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      first_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  })

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.first_name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("E-Mail bereits registriert", {
            description: "Bitte melde dich an oder verwende eine andere E-Mail.",
          })
        } else {
          toast.error("Fehler bei der Registrierung", {
            description: error.message,
          })
        }
        return
      }

      toast.success("Registrierung erfolgreich!", {
        description: "Bitte bestätige deine E-Mail-Adresse mit dem Code.",
      })
      // Redirect to verify-email page with email for code entry
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignup() {
    setIsGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error("Fehler bei der Google-Registrierung", {
          description: error.message,
        })
        setIsGoogleLoading(false)
      }
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
      setIsGoogleLoading(false)
    }
  }

  return (
    <motion.div variants={fadeIn} initial="initial" animate="animate">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vorname</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Max"
                        autoComplete="given-name"
                        disabled={isLoading || isGoogleLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        autoComplete="email"
                        disabled={isLoading || isGoogleLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isLoading || isGoogleLoading}
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
                        disabled={isLoading || isGoogleLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isGoogleLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Ich akzeptiere die{" "}
                        <Link
                          href="/agb"
                          className="text-primary hover:underline"
                          target="_blank"
                        >
                          AGB
                        </Link>{" "}
                        und{" "}
                        <Link
                          href="/datenschutz"
                          className="text-primary hover:underline"
                          target="_blank"
                        >
                          Datenschutzerklärung
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrieren
              </Button>
            </form>
          </Form>

          {/*
            GOOGLE AUTH - Ausgeblendet, aber vollständig implementiert.
            Kann auf Kundenwunsch aktiviert werden.
            Voraussetzung: Google OAuth in Supabase Dashboard konfigurieren.

            Um zu aktivieren: Kommentar entfernen und isGoogleLoading State behalten.

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              oder
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Mit Google registrieren
          </Button>
          */}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Bereits ein Konto?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Jetzt anmelden
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
