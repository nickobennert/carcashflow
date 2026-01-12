import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const next = redirectTo.startsWith("/") ? redirectTo : "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has a complete profile
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Type assertion since table might not exist yet
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", user.id)
          .single() as { data: Pick<Profile, "first_name"> | null; error: unknown }

        // If profile doesn't exist or is incomplete, redirect to setup
        if (!profile || !profile.first_name) {
          return NextResponse.redirect(`${origin}/profile/setup`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-callback-error`)
}
