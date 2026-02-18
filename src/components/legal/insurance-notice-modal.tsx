"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { ShieldAlert, CheckCircle2, Loader2 } from "lucide-react"
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
import { modalContent } from "@/lib/animations"

interface InsuranceNoticeModalProps {
  open: boolean
  onAccepted: () => void
}

export function InsuranceNoticeModal({ open, onAccepted }: InsuranceNoticeModalProps) {
  const [isChecked, setIsChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleAccept() {
    if (!isChecked) {
      toast.error("Bitte bestätige den Versicherungshinweis")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptance_type: "insurance_notice" }),
      })

      if (!response.ok) {
        throw new Error("Failed to save acceptance")
      }

      toast.success("Versicherungshinweis bestätigt")
      onAccepted()
    } catch (error) {
      console.error("Error accepting insurance notice:", error)
      toast.error("Fehler beim Speichern. Bitte versuche es erneut.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg"
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <ShieldAlert className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <DialogTitle>Versicherungshinweis</DialogTitle>
                <DialogDescription>
                  Wichtige Hinweise zur Versicherung bei Mitfahrgelegenheiten
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="mt-4 h-[300px] rounded-lg border bg-muted/30 p-4">
            <div className="space-y-4 text-sm pr-3">
              <h3 className="font-semibold">
                Wichtige Hinweise zur Versicherung bei Mitfahrgelegenheiten
              </h3>

              <h4 className="font-medium mt-4">§ 1 KFZ-Haftpflichtversicherung</h4>
              <p>
                (1) In Deutschland ist jeder Fahrzeughalter gesetzlich verpflichtet, eine
                KFZ-Haftpflichtversicherung abzuschließen (Pflichtversicherung). Diese Versicherung
                deckt grundsätzlich auch Schäden ab, die Mitfahrern bei einem Unfall entstehen.
              </p>
              <p>
                (2) Der Fahrer bzw. Fahrzeughalter ist dafür verantwortlich, dass für das eingesetzte
                Fahrzeug eine gültige KFZ-Haftpflichtversicherung besteht.
              </p>

              <h4 className="font-medium mt-4">§ 2 Keine Prüfung durch die Plattform</h4>
              <p>
                (1) Diese Plattform prüft <strong>nicht</strong>, ob für angebotene Fahrzeuge ein
                gültiger Versicherungsschutz besteht.
              </p>
              <p>
                (2) Die Plattform übernimmt keine Gewähr dafür, dass Fahrer über ausreichenden
                Versicherungsschutz verfügen.
              </p>

              <h4 className="font-medium mt-4">§ 3 Empfehlung an Mitfahrer</h4>
              <p>
                (1) Mitfahrern wird dringend empfohlen, vor Fahrtantritt den Fahrer zu fragen,
                ob eine gültige KFZ-Haftpflichtversicherung besteht.
              </p>
              <p>
                (2) Die Mitfahrt erfolgt auf eigenes Risiko. Mitfahrer sollten sich bewusst sein,
                dass trotz bestehender Haftpflichtversicherung des Fahrers nicht alle denkbaren
                Schäden abgedeckt sein müssen.
              </p>
              <p>
                (3) Es kann sinnvoll sein, eine eigene private Unfallversicherung abzuschließen,
                die auch bei Unfällen als Mitfahrer Leistungen erbringt.
              </p>

              <h4 className="font-medium mt-4">§ 4 Hinweis an Fahrer</h4>
              <p>
                (1) Fahrer sollten vor der Mitnahme fremder Personen ihren Versicherungsschutz
                prüfen und sicherstellen, dass die Mitnahme von Mitfahrern keine Einschränkung
                ihres Versicherungsschutzes zur Folge hat.
              </p>
              <p>
                (2) Bei regelmäßiger Mitnahme von Mitfahrern gegen Kostenbeteiligung wird empfohlen,
                den eigenen Versicherer darüber zu informieren, um etwaige Deckungslücken
                auszuschließen.
              </p>
              <p>
                (3) Fahrer sollten beachten, dass eine Kostenbeteiligung, die über die tatsächlichen
                Fahrtkosten hinausgeht, den Versicherungsschutz gefährden und eine gewerbliche
                Personenbeförderungspflicht auslösen kann.
              </p>

              <h4 className="font-medium mt-4">§ 5 Haftung bei Unfällen</h4>
              <p>
                (1) Bei einem Unfall haftet grundsätzlich der Fahrzeughalter bzw. -führer nach den
                Vorschriften des Straßenverkehrsgesetzes (StVG) und des Bürgerlichen Gesetzbuches (BGB).
              </p>
              <p>
                (2) Geschädigte Mitfahrer können ihre Ansprüche direkt gegenüber der
                Haftpflichtversicherung des Fahrers geltend machen (Direktanspruch gemäß § 115 VVG).
              </p>
              <p>
                (3) Die Plattform ist nicht Partei der Fahrgemeinschaft und haftet nicht für Unfälle
                oder sonstige Schäden, die im Zusammenhang mit einer über die Plattform angebahnten
                Fahrt entstehen.
              </p>
            </div>
          </ScrollArea>

          <div className="mt-4 flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
            <Checkbox
              id="insurance-terms"
              checked={isChecked}
              onCheckedChange={(checked) => setIsChecked(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="insurance-terms" className="text-sm leading-tight cursor-pointer">
              Ich habe den Versicherungshinweis gelesen und verstanden. Mir ist bewusst,
              dass die Plattform keinen Versicherungsschutz prüft und ich selbst für
              ausreichenden Versicherungsschutz verantwortlich bin.
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
                  Verstanden und fortfahren
                </>
              )}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
