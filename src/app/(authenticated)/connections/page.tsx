import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConnectionsList } from "@/components/connections"

export const metadata: Metadata = {
  title: "Verbindungen",
  description: "Verwalte deine Verbindungen",
}

export default async function ConnectionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Verbindungen</h1>
        <p className="text-muted-foreground mt-1">
          Verwalte deine Verbindungen mit anderen Nutzern
        </p>
      </div>

      <ConnectionsList currentUserId={user.id} />
    </div>
  )
}
