"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { Loader2, Mail, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { fadeIn } from "@/lib/animations"

export function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get("email") || ""

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState(["", "", "", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [showEmailInput, setShowEmailInput] = useState(!initialEmail)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const supabase = createClient()

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Handle input change
  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1)

    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)

    // Auto-focus next input
    if (digit && index < 7) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (digit && index === 7) {
      const fullCode = newCode.join("")
      if (fullCode.length === 8) {
        handleVerify(fullCode)
      }
    }
  }

  // Handle key down for backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8)

    if (pastedData.length > 0) {
      const newCode = [...code]
      for (let i = 0; i < 8; i++) {
        newCode[i] = pastedData[i] || ""
      }
      setCode(newCode)

      // Focus last filled input or first empty
      const lastFilledIndex = Math.min(pastedData.length - 1, 7)
      inputRefs.current[lastFilledIndex]?.focus()

      // Auto-submit if complete
      if (pastedData.length === 8) {
        handleVerify(pastedData)
      }
    }
  }

  async function handleVerify(verifyCode?: string) {
    const codeToVerify = verifyCode || code.join("")

    if (codeToVerify.length !== 8) {
      toast.error("Bitte gib den vollständigen 8-stelligen Code ein")
      return
    }

    if (!email) {
      toast.error("E-Mail-Adresse fehlt", {
        description: "Bitte gehe zurück zur Anmeldung und versuche es erneut.",
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: codeToVerify,
        type: "signup",
      })

      if (error) {
        if (error.message.includes("expired")) {
          toast.error("Code abgelaufen", {
            description: "Fordere einen neuen Code an.",
          })
        } else if (error.message.includes("invalid")) {
          toast.error("Ungültiger Code", {
            description: "Bitte überprüfe den Code und versuche es erneut.",
          })
        } else {
          toast.error("Fehler bei der Verifizierung", {
            description: error.message,
          })
        }
        setCode(["", "", "", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
        return
      }

      setIsVerified(true)
      toast.success("E-Mail erfolgreich bestätigt!")

      // Redirect after short delay
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendCode() {
    if (!email) {
      toast.error("E-Mail-Adresse fehlt")
      return
    }

    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) {
        toast.error("Fehler beim Senden", {
          description: error.message,
        })
        return
      }

      toast.success("Neuer Code gesendet", {
        description: "Überprüfe dein E-Mail-Postfach.",
      })
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsResending(false)
    }
  }

  if (isVerified) {
    return (
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="rounded-full bg-offer/10 p-3">
                <CheckCircle className="h-10 w-10 text-offer" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-lg">E-Mail bestätigt!</p>
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
        <CardContent className="pt-6 space-y-6">
          {/* Email input or info */}
          {showEmailInput ? (
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Gib die E-Mail ein, mit der du dich registriert hast
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Code gesendet an:</p>
                <p className="font-medium text-sm truncate">{email}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailInput(true)}
                className="text-xs text-primary hover:underline shrink-0"
              >
                Ändern
              </button>
            </div>
          )}

          {/* Code input */}
          <div className="space-y-3">
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading}
                  className="w-10 h-12 text-center text-lg font-mono font-bold p-0"
                />
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Gib den 8-stelligen Code aus deiner E-Mail ein
            </p>
          </div>

          {/* Verify button */}
          <Button
            onClick={() => handleVerify()}
            className="w-full"
            disabled={isLoading || code.join("").length !== 8}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Code bestätigen
          </Button>

          {/* Resend link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-sm text-muted-foreground hover:text-primary disabled:opacity-50"
            >
              {isResending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Wird gesendet...
                </span>
              ) : (
                "Code nicht erhalten? Erneut senden"
              )}
            </button>
          </div>
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
