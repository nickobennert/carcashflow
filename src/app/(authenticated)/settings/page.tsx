"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Crown,
  Loader2,
  Lock,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { fadeIn } from "@/lib/animations"
import { ProfileTab } from "@/components/settings/profile-tab"
import { AccountTab } from "@/components/settings/account-tab"
import { NotificationsTab } from "@/components/settings/notifications-tab"
import { PrivacyTab } from "@/components/settings/privacy-tab"
import { SecurityTab } from "@/components/settings/security-tab"
import { AdminTab } from "@/components/settings/admin-tab"
import type { Profile } from "@/types"

const baseTabs = [
  { id: "profile", label: "Profil", icon: User },
  { id: "account", label: "Account", icon: SettingsIcon },
  { id: "notifications", label: "Benachrichtigungen", icon: Bell },
  { id: "security", label: "Sicherheit", icon: Lock },
  { id: "privacy", label: "Datenschutz", icon: Shield },
] as const

const adminTab = { id: "admin", label: "Admin", icon: Crown } as const

type TabId = (typeof baseTabs)[number]["id"] | "admin" | "security"

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Initialize activeTab from URL param or default to "profile"
  const tabFromUrl = searchParams.get("tab") as TabId | null
  const validTab = tabFromUrl && baseTabs.some((t) => t.id === tabFromUrl) ? tabFromUrl : "profile"
  const [activeTab, setActiveTab] = useState<TabId>(validTab)

  // Build tabs array based on admin status
  const tabs = isAdmin
    ? [...baseTabs, adminTab]
    : baseTabs

  // Sync tab with URL changes (for browser back/forward) - using derived state
  const currentTabFromUrl = searchParams.get("tab") as TabId | null
  const derivedActiveTab = currentTabFromUrl && (baseTabs.some((t) => t.id === currentTabFromUrl) || (isAdmin && currentTabFromUrl === "admin"))
    ? currentTabFromUrl
    : activeTab

  // Load profile and check admin status
  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileData) {
        setProfile(profileData as Profile)
      }

      // Check if user is admin via server-side API (bypasses RLS)
      try {
        const response = await fetch("/api/admin/check")
        const adminResult = await response.json()
        setIsAdmin(adminResult.isAdmin === true)
      } catch {
        setIsAdmin(false)
      }

      setIsLoading(false)
    }

    loadProfile()
  }, [router, supabase])

  const handleTabChange = useCallback(
    (tabId: TabId) => {
      setActiveTab(tabId)
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", tabId)
      router.push(`/settings?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const handleProfileUpdate = useCallback((updatedProfile: Profile) => {
    setProfile(updatedProfile)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="w-full"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">
          Verwalte dein Profil und deine Kontoeinstellungen
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Tab Navigation - Sidebar on desktop, grid on mobile */}
        <nav className="sm:w-56 shrink-0">
          <div className="grid grid-cols-6 sm:grid-cols-1 gap-1 sm:gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = derivedActiveTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "relative flex items-center justify-center sm:justify-start gap-3 p-2.5 sm:px-4 sm:py-2.5 rounded-lg text-sm font-medium transition-colors",
                    "hover:bg-muted/80",
                    isActive
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-muted rounded-lg -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={derivedActiveTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {derivedActiveTab === "profile" && (
                <ProfileTab profile={profile} onUpdate={handleProfileUpdate} />
              )}
              {derivedActiveTab === "account" && <AccountTab profile={profile} />}
              {derivedActiveTab === "notifications" && (
                <NotificationsTab profile={profile} onUpdate={handleProfileUpdate} />
              )}
              {derivedActiveTab === "privacy" && (
                <PrivacyTab profile={profile} onUpdate={handleProfileUpdate} />
              )}
              {derivedActiveTab === "security" && (
                <SecurityTab profile={profile} onUpdate={handleProfileUpdate} />
              )}
              {derivedActiveTab === "admin" && isAdmin && (
                <AdminTab profile={profile} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
