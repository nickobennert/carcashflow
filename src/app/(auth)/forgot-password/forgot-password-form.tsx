"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { motion } from "motion/react"
import { Loader2, Mail, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

const forgotPasswordSchema = z.object({
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")

  const supabase = createClient()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/reset-password`,
      })

      if (error) {
        toast.error("Fehler beim Senden", {
          description: error.message,
        })
        return
      }

      setSentEmail(data.email)
      setIsEmailSent(true)
      toast.success("E-Mail gesendet!", {
        description: "Überprüfe dein Postfach für den Reset-Link.",
      })
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="rounded-full bg-offer/10 p-3">
                <Mail className="h-10 w-10 text-offer" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">E-Mail gesendet!</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Wir haben einen Link zum Zurücksetzen deines Passworts an{" "}
                  <span className="font-medium text-foreground">{sentEmail}</span>{" "}
                  gesendet.
                </p>
                <p className="text-xs text-muted-foreground pt-2">
                  Überprüfe auch deinen Spam-Ordner, falls du die E-Mail nicht findest.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEmailSent(false)
                form.reset()
              }}
              className="w-full"
            >
              Andere E-Mail verwenden
            </Button>
            <Link href="/login" className="text-sm text-primary hover:underline">
              Zurück zur Anmeldung
            </Link>
          </CardFooter>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        autoComplete="email"
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
                Link senden
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Erinnerst du dich wieder?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Zur Anmeldung
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
