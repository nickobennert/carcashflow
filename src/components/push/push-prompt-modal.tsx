"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Bell, X, Smartphone, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePushNotifications } from "@/hooks/use-push-notifications"

interface PushPromptModalProps {
  // Show modal automatically after delay (ms), or null to control manually
  autoShowDelay?: number | null
  // Callback when user makes a decision
  onDecision?: (accepted: boolean) => void
}

const DISMISSED_KEY = "push_prompt_dismissed"
const DISMISSED_UNTIL_KEY = "push_prompt_dismissed_until"

export function PushPromptModal({
  autoShowDelay = 3000,
  onDecision,
}: PushPromptModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
  } = usePushNotifications()

  // Auto-show logic
  useEffect(() => {
    if (autoShowDelay === null) return
    if (!isSupported) return
    if (permission === "denied") return
    if (isSubscribed) return

    // Check if user dismissed recently
    const dismissedUntil = localStorage.getItem(DISMISSED_UNTIL_KEY)
    if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
      return
    }

    const timer = setTimeout(() => {
      setIsOpen(true)
    }, autoShowDelay)

    return () => clearTimeout(timer)
  }, [autoShowDelay, isSupported, permission, isSubscribed])

  const handleAccept = async () => {
    const success = await subscribe()
    if (success) {
      setIsSuccess(true)
      localStorage.removeItem(DISMISSED_KEY)
      localStorage.removeItem(DISMISSED_UNTIL_KEY)
      onDecision?.(true)

      // Close after showing success
      setTimeout(() => {
        setIsOpen(false)
        setIsSuccess(false)
      }, 2000)
    }
  }

  const handleDismiss = () => {
    // Don't show again for 7 days
    const dismissUntil = new Date()
    dismissUntil.setDate(dismissUntil.getDate() + 7)
    localStorage.setItem(DISMISSED_UNTIL_KEY, dismissUntil.toISOString())
    localStorage.setItem(DISMISSED_KEY, "true")

    setIsOpen(false)
    onDecision?.(false)
  }

  // Don't render if not supported or already subscribed
  if (!isSupported || isSubscribed || permission === "denied") {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center py-6"
            >
              <div className="rounded-full bg-offer/10 p-4 mb-4">
                <CheckCircle className="h-12 w-12 text-offer" />
              </div>
              <p className="text-lg font-semibold">Benachrichtigungen aktiviert!</p>
              <p className="text-sm text-muted-foreground">
                Du wirst ab sofort benachrichtigt.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader className="text-center sm:text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Bell className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <DialogTitle className="text-xl">
                  Push-Benachrichtigungen aktivieren?
                </DialogTitle>
                <DialogDescription className="text-base">
                  Erhalte sofort eine Nachricht auf dein Gerät, wenn:
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 my-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Smartphone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm">Jemand dir eine Nachricht schreibt</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Bell className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm">Eine passende Fahrt gefunden wurde</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Wird aktiviert..." : "Aktivieren"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={isLoading}
                  className="w-full text-muted-foreground"
                >
                  Später
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Du kannst dies jederzeit in den Einstellungen ändern.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {!isSuccess && (
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Schließen</span>
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
