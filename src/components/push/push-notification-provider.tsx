"use client"

import { useEffect } from "react"
import { PushPromptModal } from "./push-prompt-modal"
import { registerServiceWorker } from "@/lib/push"

interface PushNotificationProviderProps {
  children: React.ReactNode
  // Show prompt automatically after login (delay in ms)
  showPromptDelay?: number
}

/**
 * Provider component that:
 * 1. Registers the service worker on mount
 * 2. Shows the push notification prompt modal after delay
 *
 * Use this in authenticated layouts to enable push notifications
 */
export function PushNotificationProvider({
  children,
  showPromptDelay = 5000,
}: PushNotificationProviderProps) {
  // Register service worker on mount
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      registerServiceWorker().catch((err) => {
        console.error("[Push] Failed to register service worker:", err)
      })
    }
  }, [])

  return (
    <>
      {children}
      <PushPromptModal autoShowDelay={showPromptDelay} />
    </>
  )
}
