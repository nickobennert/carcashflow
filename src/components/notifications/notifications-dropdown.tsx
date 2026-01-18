"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { format, formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import {
  Bell,
  MessageSquare,
  Car,
  Info,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  new_message: MessageSquare,
  ride_match: Car,
  system: Info,
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  async function loadNotifications() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      const notifs = (data || []) as Notification[]
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n) => !n.is_read).length)
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true } as never)
        .eq("id", id)

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  async function markAllAsRead() {
    setIsMarkingAll(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase
        .from("notifications")
        .update({ is_read: true } as never)
        .eq("user_id", user.id)
        .eq("is_read", false)

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast.success("Alle als gelesen markiert")
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast.error("Fehler beim Markieren")
    } finally {
      setIsMarkingAll(false)
    }
  }

  async function deleteNotification(id: string) {
    try {
      await supabase.from("notifications").delete().eq("id", id)

      setNotifications((prev) => {
        const notif = prev.find((n) => n.id === id)
        if (notif && !notif.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1))
        }
        return prev.filter((n) => n.id !== id)
      })
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast.error("Fehler beim Löschen")
    }
  }

  async function clearAllNotifications() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from("notifications").delete().eq("user_id", user.id)

      setNotifications([])
      setUnreadCount(0)
      toast.success("Alle Benachrichtigungen gelöscht")
    } catch (error) {
      console.error("Error clearing notifications:", error)
      toast.error("Fehler beim Löschen")
    }
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 max-w-sm p-0">
          <div className="flex items-center justify-between p-3 border-b">
            <h4 className="font-semibold">Benachrichtigungen</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} neu</Badge>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Keine Benachrichtigungen</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              {recentNotifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onRead={() => markAsRead(notif.id)}
                  compact
                />
              ))}
            </ScrollArea>
          )}

          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-center text-sm"
              onClick={() => setIsModalOpen(true)}
            >
              Alle Benachrichtigungen
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Full Notifications Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <DialogTitle>Alle Benachrichtigungen</DialogTitle>
                <DialogDescription>
                  {notifications.length} Benachrichtigungen, {unreadCount} ungelesen
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={isMarkingAll}
                  >
                    {isMarkingAll ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCheck className="h-4 w-4 mr-2" />
                    )}
                    <span className="hidden sm:inline">Alle gelesen</span>
                    <span className="sm:hidden">Gelesen</span>
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllNotifications}
                  >
                    <Trash2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Alle löschen</span>
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Keine Benachrichtigungen vorhanden</p>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-2"
              >
                {notifications.map((notif) => (
                  <motion.div key={notif.id} variants={staggerItem}>
                    <NotificationItem
                      notification={notif}
                      onRead={() => markAsRead(notif.id)}
                      onDelete={() => deleteNotification(notif.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface NotificationItemProps {
  notification: Notification
  onRead: () => void
  onDelete?: () => void
  compact?: boolean
}

function NotificationItem({
  notification,
  onRead,
  onDelete,
  compact,
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || Info

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors group",
        !notification.is_read && "bg-primary/5",
        compact ? "cursor-pointer" : "rounded-lg border"
      )}
      onClick={() => {
        if (!notification.is_read) {
          onRead()
        }
      }}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          notification.type === "new_message" && "bg-blue-500/10 text-blue-600",
          notification.type === "ride_match" && "bg-green-500/10 text-green-600",
          notification.type === "system" && "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-tight",
              !notification.is_read && "font-medium"
            )}
          >
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: de,
          })}
        </p>
      </div>

      {!compact && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
