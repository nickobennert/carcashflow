"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { motion } from "motion/react"
import { ChevronDown, Loader2 } from "lucide-react"
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
import { cn } from "@/lib/utils"

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
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)

  function handleTermsScroll(e: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setHasScrolledToBottom(true)
    }
  }

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
              {/* Nutzungsvereinbarung - scrollable terms */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Nutzungsvereinbarung</p>
                <div className="relative">
                  <div
                    onScroll={handleTermsScroll}
                    className="h-[300px] overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3"
                  >
                    <h3 className="font-semibold text-foreground">
                      Nutzungshinweise für die Mitfahrbörse
                    </h3>

                    <h4 className="font-medium text-foreground mt-3">§ 1 Zweck der Plattform</h4>
                    <p>
                      (1) Die Plattform stellt ausschließlich eine technische Möglichkeit zur
                      Kontaktanbahnung zwischen Schulungsteilnehmern bereit, die gemeinsame Fahrten
                      organisieren möchten.
                    </p>
                    <p>
                      (2) Die Plattform vermittelt keine Fahrten, führt keine Beförderung durch und
                      ist nicht Vertragspartei etwaiger Vereinbarungen zwischen den Nutzern.
                    </p>
                    <p>
                      (3) Sämtliche Absprachen über Fahrten, Routen, Zeitpunkte und Kostenbeteiligung
                      erfolgen eigenverantwortlich zwischen den beteiligten Nutzern.
                    </p>

                    <h4 className="font-medium text-foreground mt-3">§ 2 Keine gewerbliche Personenbeförderung</h4>
                    <p>
                      (1) Die über diese Plattform angebotenen Mitfahrgelegenheiten sind ausschließlich
                      private Fahrgemeinschaften im Sinne der Kostenteilung. Es handelt sich nicht um
                      gewerbliche Personenbeförderung im Sinne des Personenbeförderungsgesetzes (PBefG).
                    </p>
                    <p>
                      (2) Fahrer dürfen über diese Plattform nur Fahrten anbieten, die sie ohnehin
                      durchführen würden. Das gezielte Anbieten von Fahrten ausschließlich zum Zweck
                      der Personenbeförderung ist nicht gestattet.
                    </p>
                    <p>
                      (3) Eine etwaige Kostenbeteiligung durch Mitfahrer darf die tatsächlich anfallenden
                      Fahrtkosten (insbesondere Kraftstoff, Maut, Parkgebühren) nicht übersteigen.
                      Gewinnerzielung ist ausdrücklich untersagt.
                    </p>

                    <h4 className="font-medium text-foreground mt-3">§ 3 Eigenverantwortung der Nutzer</h4>
                    <p>
                      (1) Jeder Nutzer handelt in voller Eigenverantwortung. Die Teilnahme an einer
                      Fahrgemeinschaft erfolgt auf eigenes Risiko.
                    </p>
                    <p>
                      (2) Es obliegt den Nutzern, sich vor Fahrtantritt über die folgenden Punkte
                      selbst zu vergewissern:
                    </p>
                    <p className="pl-4">
                      a) Der Fahrer verfügt über eine gültige Fahrerlaubnis.<br />
                      b) Das Fahrzeug ist ordnungsgemäß zugelassen und versichert.<br />
                      c) Das Fahrzeug befindet sich in einem verkehrssicheren Zustand.<br />
                      d) Der Fahrer ist fahrtüchtig (kein Alkohol, keine Drogen, keine übermäßige Müdigkeit).
                    </p>
                    <p>
                      (3) Mitfahrer sind eigenverantwortlich dafür, sich anzuschnallen und die
                      Straßenverkehrsordnung zu beachten.
                    </p>

                    <h4 className="font-medium text-foreground mt-3">§ 4 Haftungsausschluss der Plattform</h4>
                    <p>
                      (1) Die Plattform übernimmt keinerlei Haftung für:
                    </p>
                    <p className="pl-4">
                      a) die Richtigkeit, Vollständigkeit oder Aktualität der von Nutzern eingestellten Angaben,<br />
                      b) die Durchführung, den Verlauf oder das Ergebnis einer über die Plattform angebahnten Fahrt,<br />
                      c) Schäden, die im Zusammenhang mit einer Fahrgemeinschaft entstehen, gleich welcher Art,<br />
                      d) das Verhalten der Nutzer untereinander.
                    </p>
                    <p>
                      (2) Insbesondere prüft die Plattform nicht: die Identität der Nutzer, das Vorliegen
                      einer gültigen Fahrerlaubnis, den Versicherungsschutz des Fahrzeugs oder die
                      Verkehrssicherheit des Fahrzeugs.
                    </p>
                    <p>
                      (3) Dieser Haftungsausschluss gilt nicht, soweit die Plattform Schäden vorsätzlich
                      oder grob fahrlässig verursacht oder soweit eine Haftung gesetzlich zwingend
                      vorgeschrieben ist.
                    </p>

                    <h4 className="font-medium text-foreground mt-3">§ 5 Pflichten der Nutzer</h4>
                    <p>
                      (1) Nutzer verpflichten sich, ausschließlich wahrheitsgemäße Angaben zu machen.
                    </p>
                    <p>
                      (2) Nutzer dürfen die Plattform nicht für gewerbliche Personenbeförderung nutzen.
                    </p>
                    <p>
                      (3) Nutzer verpflichten sich, die geltenden Gesetze einzuhalten, insbesondere die
                      Straßenverkehrsordnung und das Personenbeförderungsgesetz.
                    </p>
                    <p>
                      (4) Bei Verstößen behält sich die Plattform das Recht vor, Nutzer von der Nutzung
                      auszuschließen.
                    </p>

                    <h4 className="font-medium text-foreground mt-3">§ 6 Kostenbeteiligung</h4>
                    <p>
                      (1) Eine Kostenbeteiligung durch Mitfahrer ist zulässig, sofern sie die
                      tatsächlichen Fahrtkosten nicht übersteigt.
                    </p>
                    <p>
                      (2) Zu den erstattungsfähigen Kosten zählen insbesondere: Kraftstoffkosten,
                      Mautgebühren, Parkgebühren sowie ein angemessener Anteil für Fahrzeugverschleiß.
                    </p>
                    <p>
                      (3) Die Aufteilung der Kosten ist Sache der beteiligten Nutzer. Die Plattform ist
                      an der Kostenabwicklung nicht beteiligt und nimmt keine Zahlungen entgegen oder weiter.
                    </p>
                    <p>
                      (4) Es wird empfohlen, die Kostenbeteiligung vor Fahrtantritt zu besprechen und
                      zu vereinbaren.
                    </p>

                    <h4 className="font-medium text-foreground mt-3">§ 7 Meldung von Verstößen</h4>
                    <p>
                      (1) Nutzer können Verstöße gegen diese Nutzungshinweise über die Meldefunktion
                      der Plattform anzeigen.
                    </p>
                    <p>
                      (2) Die Plattform behält sich vor, gemeldete Inhalte zu prüfen und gegebenenfalls
                      zu entfernen.
                    </p>

                    <h4 className="font-medium text-foreground mt-3">§ 8 Änderungen</h4>
                    <p>
                      (1) Die Plattform behält sich vor, diese Nutzungshinweise jederzeit zu ändern.
                    </p>
                    <p>
                      (2) Änderungen werden den Nutzern in geeigneter Weise mitgeteilt. Die fortgesetzte
                      Nutzung der Plattform gilt als Zustimmung zu den geänderten Bedingungen.
                    </p>
                  </div>

                  {/* Scroll indicator */}
                  {!hasScrolledToBottom && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/80 to-transparent rounded-b-lg pointer-events-none flex items-end justify-center pb-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 animate-pulse">
                        <ChevronDown className="h-3 w-3" />
                        Bitte scrolle bis zum Ende
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Accept terms checkbox */}
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!hasScrolledToBottom || isLoading || isGoogleLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className={cn(
                        "text-sm font-normal",
                        !hasScrolledToBottom && "text-muted-foreground"
                      )}>
                        Ich habe die Nutzungsvereinbarung gelesen und akzeptiere diese
                      </FormLabel>
                      {!hasScrolledToBottom && (
                        <p className="text-xs text-muted-foreground">
                          Bitte lies die Nutzungsvereinbarung bis zum Ende
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Es gelten unsere{" "}
                        <Link href="/agb" className="text-primary hover:underline" target="_blank">
                          AGB
                        </Link>{" "}
                        und{" "}
                        <Link href="/datenschutz" className="text-primary hover:underline" target="_blank">
                          Datenschutzerklärung
                        </Link>
                      </p>
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
