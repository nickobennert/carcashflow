import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileSetupForm } from "./profile-setup-form"
import type { Profile } from "@/types"

export const metadata: Metadata = {
  title: "Profil einrichten",
  description: "Vervollständige dein Profil, um loszulegen",
}

export default async function ProfileSetupPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if profile is already complete
  // Using type assertion since table might not exist yet in Supabase
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single() as { data: Profile | null; error: unknown }

  // If profile is complete, redirect to dashboard
  if (profile?.first_name && profile?.username) {
    redirect("/dashboard")
  }

  // Get first name from user metadata (if signed up with email)
  const defaultFirstName = (user.user_metadata?.first_name as string) || ""

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Willkommen bei Carcashflow!
        </h1>
        <p className="text-muted-foreground">
          Vervollständige dein Profil, um loszulegen
        </p>
      </div>
      <ProfileSetupForm
        userId={user.id}
        email={user.email || ""}
        defaultFirstName={defaultFirstName}
        existingProfile={profile}
      />
    </div>
  )
}
