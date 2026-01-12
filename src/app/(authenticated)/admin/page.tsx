import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Verwaltung und Moderation",
}

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is admin
  const { data: adminData } = await supabase
    .from("super_admins")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (!adminData) {
    redirect("/dashboard")
  }

  const admin = adminData as { role: string }

  return <AdminDashboard userId={user.id} role={admin.role} />
}
