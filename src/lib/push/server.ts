/**
 * Server-side Push Notification Utilities
 *
 * Uses web-push library to send push notifications
 */

import webpush from "web-push"

// Configure web-push with VAPID details
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@fahr-mit.de"

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: {
    url?: string
    conversationId?: string
    [key: string]: unknown
  }
}

/**
 * Send a push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("[Push] VAPID keys not configured")
    return { success: false, error: "VAPID keys not configured" }
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  }

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/icon-192.png",
        badge: payload.badge || "/icon-badge.png",
        tag: payload.tag || "default",
        data: payload.data || {},
      }),
      {
        TTL: 60 * 60, // 1 hour
        urgency: "normal",
      }
    )

    return { success: true }
  } catch (error) {
    const webPushError = error as { statusCode?: number; body?: string }

    // Handle specific error codes
    if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
      // Subscription has expired or is no longer valid
      console.log("[Push] Subscription expired:", subscription.endpoint)
      return { success: false, error: "subscription_expired" }
    }

    console.error("[Push] Failed to send notification:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send push notifications to multiple subscriptions
 */
export async function sendPushToMultiple(
  subscriptions: PushSubscriptionData[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; expired: string[] }> {
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  )

  let sent = 0
  let failed = 0
  const expired: string[] = []

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value.success) {
      sent++
    } else {
      failed++
      if (
        result.status === "fulfilled" &&
        result.value.error === "subscription_expired"
      ) {
        expired.push(subscriptions[index].endpoint)
      }
    }
  })

  return { sent, failed, expired }
}
