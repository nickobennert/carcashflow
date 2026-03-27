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
import { UsageRulesContent } from "@/components/legal/usage-rules-content"
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
                    <DialogTitle>Regeln für die Nutzung</DialogTitle>
                    <DialogDescription>
                      Bitte lies und akzeptiere die Nutzungsregeln
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="mt-4 h-[300px] rounded-lg border bg-muted/30 p-4">
                <UsageRulesContent />
              </ScrollArea>

              <div className="mt-4 flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
                <Checkbox
                  id="terms"
                  checked={isChecked}
                  onCheckedChange={(checked) => setIsChecked(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                  Ich habe die Regeln für die Nutzung der FAHR MIT App gelesen und verstanden.
                  Mir ist bewusst, dass alle Fahrten auf eigene Verantwortung erfolgen, der
                  Betreiber keine Haftung übernimmt und Verstöße zum Ausschluss führen können.
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
