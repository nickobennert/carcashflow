// Service Worker for Push Notifications
// This file must be in /public to be accessible at the root

const CACHE_NAME = "fahrmit-v1"

// Install event
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...")
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", (event) => {
  console.log("[SW] Service worker activated")
  event.waitUntil(self.clients.claim())
})

// Push event - triggered when a push notification is received
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event)

  let data = {
    title: "Fahr mit!",
    body: "Du hast eine neue Benachrichtigung",
    icon: "/icon-192.png",
    badge: "/icon-badge.png",
    tag: "default",
    data: { url: "/messages" },
  }

  // Parse push data if available
  if (event.data) {
    try {
      const payload = event.data.json()
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || data.data,
      }
    } catch (e) {
      console.error("[SW] Error parsing push data:", e)
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [
      { action: "open", title: "Öffnen" },
      { action: "close", title: "Schließen" },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event)

  event.notification.close()

  if (event.action === "close") {
    return
  }

  // Get the URL to open
  const urlToOpen = event.notification.data?.url || "/messages"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus()
          client.navigate(urlToOpen)
          return
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Notification close event
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event)
})
