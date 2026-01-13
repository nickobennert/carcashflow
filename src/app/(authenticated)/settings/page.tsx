"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  User,
  Settings as SettingsIcon,
  Bell,
  CreditCard,
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
import { SubscriptionTab } from "@/components/settings/subscription-tab"
import { PrivacyTab } from "@/components/settings/privacy-tab"
import { SecurityTab } from "@/components/settings/security-tab"
import { AdminTab } from "@/components/settings/admin-tab"
import type { Profile } from "@/types"

const baseTabs = [
  { id: "profile", label: "Profil", icon: User },
  { id: "account", label: "Account", icon: SettingsIcon },
  { id: "notifications", label: "Benachrichtigungen", icon: Bell },
  { id: "security", label: "Sicherheit", icon: Lock },
  { id: "subscription", label: "Abonnement", icon: CreditCard },
  { id: "privacy", label: "Datenschutz", icon: Shield },
] as const

const adminTab = { id: "admin", label: "Admin", icon: Crown } as const

type TabId = (typeof baseTabs)[number]["id"] | "admin" | "security"

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabId>("profile")
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Build tabs array based on admin status
  const tabs = isAdmin
    ? [...baseTabs, adminTab]
    : baseTabs

  // Get tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab") as TabId | null
    if (tab && (baseTabs.some((t) => t.id === tab) || (isAdmin && tab === "admin"))) {
      setActiveTab(tab)
    }
  }, [searchParams, isAdmin])

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

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from("super_admins")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      // Debug: log admin check result
      if (adminError) {
        console.error("Admin check error:", adminError)
      }

      setIsAdmin(!!adminData)

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
        {/* Tab Navigation - Sidebar on desktop, horizontal on mobile */}
        <nav className="sm:w-56 shrink-0">
          <div className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                    "hover:bg-muted/80",
                    isActive
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
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
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "profile" && (
                <ProfileTab profile={profile} onUpdate={handleProfileUpdate} />
              )}
              {activeTab === "account" && <AccountTab profile={profile} />}
              {activeTab === "notifications" && (
                <NotificationsTab profile={profile} onUpdate={handleProfileUpdate} />
              )}
              {activeTab === "subscription" && (
                <SubscriptionTab profile={profile} onUpdate={handleProfileUpdate} />
              )}
              {activeTab === "privacy" && (
                <PrivacyTab profile={profile} onUpdate={handleProfileUpdate} />
              )}
              {activeTab === "security" && (
                <SecurityTab profile={profile} onUpdate={handleProfileUpdate} />
              )}
              {activeTab === "admin" && isAdmin && (
                <AdminTab profile={profile} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
