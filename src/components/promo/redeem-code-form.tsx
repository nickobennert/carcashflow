"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Gift, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fadeIn } from "@/lib/animations"

interface RedeemCodeFormProps {
  onSuccess?: () => void
}

export function RedeemCodeForm({ onSuccess }: RedeemCodeFormProps) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!code.trim()) {
      toast.error("Bitte gib einen Code ein")
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/promo-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({ success: false, message: data.error || "Fehler beim Einlösen" })
        return
      }

      setResult({ success: true, message: data.message })
      setCode("")
      onSuccess?.()
    } catch (error) {
      console.error("Error redeeming code:", error)
      setResult({ success: false, message: "Netzwerkfehler beim Einlösen" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Promo Code einlösen
        </CardTitle>
        <CardDescription>
          Hast du einen Gutscheincode? Löse ihn hier ein.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promo-code">Code</Label>
            <div className="flex gap-2">
              <Input
                id="promo-code"
                placeholder="z.B. WILLKOMMEN2024"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="font-mono uppercase"
              />
              <Button type="submit" disabled={isLoading || !code.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Einlösen"
                )}
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`flex items-start gap-3 rounded-lg p-3 ${
                  result.success
                    ? "bg-offer/10 text-offer"
                    : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{result.message}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </CardContent>
    </Card>
  )
}
