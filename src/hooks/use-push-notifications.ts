"use client"

import { useState, useEffect, useCallback } from "react"
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  getCurrentSubscription,
  unsubscribeFromPush,
  extractSubscriptionData,
} from "@/lib/push"

interface UsePushNotificationsReturn {
  // Status
  isSupported: boolean
  permission: NotificationPermission | "unsupported"
  isSubscribed: boolean
  isLoading: boolean
  error: string | null

  // Actions
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  checkSubscription: () => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check initial status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const supported = isPushSupported()
        setIsSupported(supported)

        if (!supported) {
          setPermission("unsupported")
          setIsLoading(false)
          return
        }

        setPermission(getNotificationPermission())

        // Check if already subscribed
        const subscription = await getCurrentSubscription()
        setIsSubscribed(!!subscription)
      } catch (err) {
        console.error("[Push] Error checking status:", err)
        setError("Fehler beim Prüfen des Push-Status")
      } finally {
        setIsLoading(false)
      }
    }

    checkStatus()
  }, [])

  // Check subscription status from server
  const checkSubscription = useCallback(async () => {
    try {
      const response = await fetch("/api/push/subscribe")
      if (response.ok) {
        const data = await response.json()
        setIsSubscribed(data.subscription_count > 0)
      }
    } catch (err) {
      console.error("[Push] Error checking subscription:", err)
    }
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push-Benachrichtigungen werden nicht unterstützt")
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Request permission
      const newPermission = await requestNotificationPermission()
      setPermission(newPermission)

      if (newPermission !== "granted") {
        setError("Benachrichtigungen wurden nicht erlaubt")
        return false
      }

      // Register service worker
      const registration = await registerServiceWorker()

      // Subscribe to push
      const subscription = await subscribeToPush(registration)
      const subscriptionData = extractSubscriptionData(subscription)

      // Save to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscriptionData),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Speichern der Subscription")
      }

      setIsSubscribed(true)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler"
      setError(message)
      console.error("[Push] Subscribe error:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Get current subscription to get endpoint
      const subscription = await getCurrentSubscription()
      if (!subscription) {
        setIsSubscribed(false)
        return true
      }

      // Unsubscribe locally
      await unsubscribeFromPush()

      // Remove from server
      const response = await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })

      if (!response.ok) {
        console.error("[Push] Failed to delete subscription from server")
      }

      setIsSubscribed(false)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler"
      setError(message)
      console.error("[Push] Unsubscribe error:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    checkSubscription,
  }
}
