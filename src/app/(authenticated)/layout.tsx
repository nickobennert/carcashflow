import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/layout"
import { LegalCheckWrapper } from "@/components/legal"
import type { Profile } from "@/types"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single() as { data: Profile | null; error: unknown }

  // Get unread message count (placeholder - will be implemented later)
  const unreadMessages = 0
  const unreadNotifications = 0

  const userData = profile
    ? {
        name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.username,
        email: profile.email || user.email || "",
        avatar: profile.avatar_url || undefined,
      }
    : {
        name: user.email?.split("@")[0] || "User",
        email: user.email || "",
        avatar: undefined,
      }

  return (
    <AppShell
      user={userData}
      unreadMessages={unreadMessages}
      unreadNotifications={unreadNotifications}
    >
      <LegalCheckWrapper />
      {children}
    </AppShell>
  )
}
