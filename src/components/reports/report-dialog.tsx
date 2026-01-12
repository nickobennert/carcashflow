"use client"

import { useState } from "react"
import { Flag, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

type ReportReason = "spam" | "inappropriate" | "fake" | "harassment" | "other"

const reasons: { value: ReportReason; label: string; description: string }[] = [
  {
    value: "spam",
    label: "Spam",
    description: "Unerwünschte oder wiederholte Inhalte",
  },
  {
    value: "inappropriate",
    label: "Unangemessen",
    description: "Beleidigende oder anstößige Inhalte",
  },
  {
    value: "fake",
    label: "Fake/Betrug",
    description: "Gefälschte Informationen oder Betrugsversuch",
  },
  {
    value: "harassment",
    label: "Belästigung",
    description: "Belästigung oder Mobbing",
  },
  {
    value: "other",
    label: "Sonstiges",
    description: "Anderer Grund",
  },
]

interface ReportDialogProps {
  targetType: "user" | "ride"
  targetId: string
  targetName?: string
  trigger?: React.ReactNode
}

export function ReportDialog({
  targetType,
  targetId,
  targetName,
  trigger,
}: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit() {
    if (!reason) {
      toast.error("Bitte wähle einen Grund aus")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reported_user_id: targetType === "user" ? targetId : null,
          reported_ride_id: targetType === "ride" ? targetId : null,
          reason,
          description: description.trim() || null,
        }),
      })

      const { error } = await response.json()

      if (error) {
        if (response.status === 409) {
          toast.info("Du hast dies bereits gemeldet")
        } else {
          throw new Error(error)
        }
        return
      }

      toast.success("Meldung eingereicht. Wir prüfen den Fall.")
      setOpen(false)
      setReason(null)
      setDescription("")
    } catch (error) {
      console.error("Error submitting report:", error)
      toast.error("Fehler beim Einreichen der Meldung")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2 text-destructive">
            <Flag className="h-4 w-4" />
            Melden
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {targetType === "user" ? "Nutzer" : "Route"} melden
          </DialogTitle>
          <DialogDescription>
            {targetName
              ? `Melde "${targetName}" wegen eines Verstoßes.`
              : "Melde diesen Inhalt wegen eines Verstoßes."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Grund der Meldung</Label>
            <RadioGroup
              value={reason || ""}
              onValueChange={(value) => setReason(value as ReportReason)}
            >
              {reasons.map((r) => (
                <div
                  key={r.value}
                  className="flex items-start space-x-3 space-y-0"
                >
                  <RadioGroupItem value={r.value} id={r.value} className="mt-1" />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    <span className="font-medium">{r.label}</span>
                    <p className="text-sm text-muted-foreground">
                      {r.description}
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label htmlFor="description">
              Zusätzliche Details{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibe den Vorfall genauer..."
              className="resize-none h-24"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isLoading}
            variant="destructive"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Meldung einreichen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
