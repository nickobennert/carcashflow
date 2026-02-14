/**
 * Push Notification Utilities
 *
 * Client-side utilities for managing push subscriptions
 */

// Convert base64 to Uint8Array (needed for VAPID key)
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

// Check current notification permission
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported"
  return Notification.permission
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported")
  }
  return Notification.requestPermission()
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported")
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    })
    console.log("[Push] Service worker registered:", registration.scope)
    return registration
  } catch (error) {
    console.error("[Push] Service worker registration failed:", error)
    throw error
  }
}

// Get existing service worker registration
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null
  const registration = await navigator.serviceWorker.getRegistration()
  return registration ?? null
}

// Subscribe to push notifications
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!vapidPublicKey) {
    throw new Error("VAPID public key not configured")
  }

  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
  })

  console.log("[Push] Subscribed to push:", subscription.endpoint)
  return subscription
}

// Get current push subscription
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const registration = await getServiceWorkerRegistration()
  if (!registration) return null
  return registration.pushManager.getSubscription()
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  const subscription = await getCurrentSubscription()
  if (!subscription) return false

  const success = await subscription.unsubscribe()
  console.log("[Push] Unsubscribed:", success)
  return success
}

// Extract subscription data for server storage
export function extractSubscriptionData(subscription: PushSubscription): {
  endpoint: string
  p256dh: string
  auth: string
} {
  const json = subscription.toJSON()
  const keys = json.keys as { p256dh: string; auth: string } | undefined

  if (!keys?.p256dh || !keys?.auth) {
    throw new Error("Invalid push subscription - missing keys")
  }

  return {
    endpoint: subscription.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  }
}
