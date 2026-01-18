"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { AlertTriangle, X, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DismissibleDisclaimerProps {
  userId?: string
}

const DISCLAIMER_VERSION = "1.0"

export function DismissibleDisclaimer({ userId }: DismissibleDisclaimerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      setIsVisible(true)
      return
    }

    async function checkAcceptance() {
      if (!userId) return

      try {
        const { data, error } = await supabase
          .from("legal_acceptances")
          .select("version")
          .eq("user_id", userId)
          .eq("acceptance_type", "disclaimer_banner")
          .single()

        // Show banner if not found, error, or version mismatch
        if (error || !data || (data as { version: string }).version !== DISCLAIMER_VERSION) {
          setIsVisible(true)
        }
      } catch {
        // If error (e.g., not found), show banner
        setIsVisible(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkAcceptance()
  }, [userId, supabase])

  async function handleConfirmDismiss() {
    if (!userId) {
      // For unauthenticated users, just hide the banner (session only)
      setIsVisible(false)
      setShowConfirmDialog(false)
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("legal_acceptances")
        .upsert({
          user_id: userId,
          acceptance_type: "disclaimer_banner",
          version: DISCLAIMER_VERSION,
          accepted_at: new Date().toISOString(),
        } as never, {
          onConflict: "user_id,acceptance_type"
        })

      if (error) throw error

      setIsVisible(false)
      setShowConfirmDialog(false)
    } catch (error) {
      console.error("Error saving disclaimer acceptance:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return null
  }

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 p-4"
          >
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  Wichtiger Hinweis
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300/90 mt-1">
                  Diese Plattform dient der Kontaktanbahnung für Rückfahrten nach Fahrzeugüberführungen.
                  Es findet keine Vermittlung oder Haftung statt. Alle Absprachen erfolgen eigenverantwortlich.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-200 dark:hover:bg-amber-900/50"
                onClick={() => setShowConfirmDialog(true)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Schließen</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hinweis ausblenden</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Bitte bestätige, dass du den folgenden Hinweis verstanden hast:
              </p>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
                Diese Plattform dient ausschließlich der Kontaktanbahnung. Der Betreiber übernimmt
                keine Vermittlung, Prüfung oder Haftung für Absprachen zwischen Nutzern.
                Alle Vereinbarungen erfolgen eigenverantwortlich.
              </div>
              <p className="text-xs text-muted-foreground">
                Weitere Informationen findest du in unserer{" "}
                <Link
                  href="/datenschutz"
                  className="underline hover:text-foreground"
                  target="_blank"
                >
                  Datenschutzerklärung
                </Link>
                .
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex items-start space-x-3 py-2">
            <Checkbox
              id="accept-disclaimer"
              checked={isAccepted}
              onCheckedChange={(checked) => setIsAccepted(checked === true)}
            />
            <label
              htmlFor="accept-disclaimer"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Ich habe den Hinweis gelesen und verstanden
            </label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDismiss}
              disabled={!isAccepted || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Bestätigen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
