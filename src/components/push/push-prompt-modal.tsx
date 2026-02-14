"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Bell, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { usePushNotifications } from "@/hooks/use-push-notifications"

interface PushPromptModalProps {
  autoShowDelay?: number | null
  onDecision?: (accepted: boolean) => void
}

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
      localStorage.removeItem(DISMISSED_UNTIL_KEY)
      onDecision?.(true)

      setTimeout(() => {
        setIsOpen(false)
        setIsSuccess(false)
      }, 1500)
    }
  }

  const handleDismiss = () => {
    const dismissUntil = new Date()
    dismissUntil.setDate(dismissUntil.getDate() + 7)
    localStorage.setItem(DISMISSED_UNTIL_KEY, dismissUntil.toISOString())

    setIsOpen(false)
    onDecision?.(false)
  }

  // Don't render if not supported or already subscribed (and not showing success)
  if (!isSupported || (isSubscribed && !isSuccess) || permission === "denied") {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-sm p-6">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-4"
            >
              <div className="rounded-full bg-offer/10 p-3 mb-3">
                <CheckCircle className="h-8 w-8 text-offer" />
              </div>
              <p className="font-semibold">Aktiviert!</p>
            </motion.div>
          ) : (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="flex justify-center mb-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
              </div>

              <h3 className="font-semibold mb-1">Push-Benachrichtigungen</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Erhalte eine Nachricht, wenn dir jemand schreibt.
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Später
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "..." : "Aktivieren"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
