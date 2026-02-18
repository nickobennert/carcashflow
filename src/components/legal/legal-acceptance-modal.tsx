"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { modalContent, modalOverlay } from "@/lib/animations"

interface LegalAcceptanceModalProps {
  onAccepted?: () => void
}

export function LegalAcceptanceModal({ onAccepted }: LegalAcceptanceModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    checkAcceptance()
  }, [])

  async function checkAcceptance() {
    try {
      const response = await fetch("/api/legal")
      const data = await response.json()

      if (!data.hasAccepted) {
        setIsOpen(true)
      }
    } catch (error) {
      console.error("Error checking legal acceptance:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAccept() {
    if (!isChecked) {
      toast.error("Bitte bestätige die Nutzungsbedingungen")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptance_type: "rideshare_terms" }),
      })

      if (!response.ok) {
        throw new Error("Failed to save acceptance")
      }

      toast.success("Nutzungsbedingungen akzeptiert")
      setIsOpen(false)
      onAccepted?.()
    } catch (error) {
      console.error("Error accepting terms:", error)
      toast.error("Fehler beim Speichern. Bitte versuche es erneut.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={() => {}}>
          <DialogContent
            className="max-w-lg"
            showCloseButton={false}
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <motion.div
              variants={modalContent}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <DialogTitle>Nutzungsbedingungen</DialogTitle>
                    <DialogDescription>
                      Bitte lies und akzeptiere die Bedingungen
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="mt-4 h-[300px] rounded-lg border bg-muted/30 p-4">
                <div className="space-y-4 text-sm">
                  <h3 className="font-semibold">Haftungsausschluss für die Mitfahrbörse</h3>

                  <p>
                    Diese Plattform dient ausschließlich der <strong>Kontaktanbahnung</strong> zwischen
                    Nutzern für gemeinsame Rückfahrten nach Fahrzeugüberführungen.
                  </p>

                  <h4 className="font-medium mt-4">1. Keine Vermittlung</h4>
                  <p>
                    Der Betreiber dieser Plattform führt <strong>keine Vermittlung</strong> von Fahrten durch.
                    Alle Absprachen bezüglich Route, Zeitpunkt, Kostenbeteiligung und sonstiger Details
                    erfolgen ausschließlich zwischen den Nutzern.
                  </p>

                  <h4 className="font-medium mt-4">2. Keine Prüfung</h4>
                  <p>
                    Der Betreiber prüft <strong>nicht</strong>:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Die Identität der Nutzer</li>
                    <li>Die Fahrtüchtigkeit von Fahrern</li>
                    <li>Die Verkehrssicherheit von Fahrzeugen</li>
                    <li>Die Richtigkeit der angegebenen Informationen</li>
                  </ul>

                  <h4 className="font-medium mt-4">3. Keine Haftung</h4>
                  <p>
                    Der Betreiber übernimmt <strong>keine Haftung</strong> für:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Unfälle oder Schäden während der Fahrt</li>
                    <li>Verspätungen oder Ausfälle</li>
                    <li>Streitigkeiten zwischen Nutzern</li>
                    <li>Finanzielle Verluste jeglicher Art</li>
                    <li>Personen- oder Sachschäden</li>
                  </ul>

                  <h4 className="font-medium mt-4">4. Eigenverantwortung</h4>
                  <p>
                    Die Nutzung dieser Plattform und die Durchführung von Fahrten erfolgt
                    <strong> auf eigenes Risiko</strong>. Jeder Nutzer ist selbst für die
                    Überprüfung seines Mitfahrers/Fahrers verantwortlich.
                  </p>

                  <h4 className="font-medium mt-4">5. Versicherung</h4>
                  <p>
                    Nutzer sind selbst dafür verantwortlich, über einen angemessenen
                    Versicherungsschutz zu verfügen. Der Betreiber empfiehlt den Abschluss
                    einer privaten Unfallversicherung.
                  </p>

                  <h4 className="font-medium mt-4">6. Rechtliche Hinweise</h4>
                  <p>
                    Bei regelmäßiger Personenbeförderung gegen Entgelt können
                    gewerberechtliche Vorschriften gelten. Nutzer sind selbst für die
                    Einhaltung aller relevanten Gesetze verantwortlich.
                  </p>
                </div>
              </ScrollArea>

              <div className="mt-4 flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
                <Checkbox
                  id="terms"
                  checked={isChecked}
                  onCheckedChange={(checked) => setIsChecked(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                  Ich habe die Nutzungsbedingungen gelesen und verstanden. Mir ist bewusst,
                  dass alle Fahrten auf eigene Verantwortung erfolgen und der Betreiber
                  keine Haftung übernimmt.
                </label>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  onClick={handleAccept}
                  disabled={!isChecked || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Akzeptieren und fortfahren
                    </>
                  )}
                </Button>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
