import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    // Get user from session
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ isAdmin: false, error: "Not authenticated" }, { status: 401 })
    }

    // Use service role client to bypass RLS
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user is admin
    const { data: adminData, error: adminError } = await adminClient
      .from("super_admins")
      .select("id, role")
      .eq("user_id", user.id)
      .maybeSingle()

    if (adminError) {
      console.error("Admin check error:", adminError)
      return NextResponse.json({ isAdmin: false, error: adminError.message }, { status: 500 })
    }

    return NextResponse.json({
      isAdmin: !!adminData,
      role: adminData?.role || null,
      userId: user.id
    })
  } catch (error) {
    console.error("Admin check error:", error)
    return NextResponse.json({ isAdmin: false, error: "Server error" }, { status: 500 })
  }
}
