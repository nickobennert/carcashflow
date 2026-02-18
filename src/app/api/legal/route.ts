import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { headers } from "next/headers"

const CURRENT_TERMS_VERSION = "1.0"

// GET /api/legal?type=rideshare_terms - Check if user has accepted current terms
// Supports optional ?type= param (default: rideshare_terms)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const acceptanceType = searchParams.get("type") || "rideshare_terms"

    const { data: acceptanceData, error } = await supabase
      .from("legal_acceptances")
      .select("id, version, accepted_at")
      .eq("user_id", user.id)
      .eq("acceptance_type", acceptanceType)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking legal acceptance:", error)
      return NextResponse.json({ error: "Failed to check acceptance" }, { status: 500 })
    }

    const acceptance = acceptanceData as { id: string; version: string; accepted_at: string } | null
    const hasAccepted = acceptance?.version === CURRENT_TERMS_VERSION

    return NextResponse.json({
      hasAccepted,
      currentVersion: CURRENT_TERMS_VERSION,
      acceptedVersion: acceptance?.version || null,
      acceptedAt: acceptance?.accepted_at || null,
    })
  } catch (error) {
    console.error("Error in GET /api/legal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/legal - Accept terms
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { acceptance_type = "rideshare_terms" } = body

    // Validate acceptance type
    const validTypes = ["rideshare_terms", "privacy_policy", "terms_of_service", "disclaimer_banner", "insurance_notice"]
    if (!validTypes.includes(acceptance_type)) {
      return NextResponse.json({ error: "Invalid acceptance type" }, { status: 400 })
    }

    // Get client IP (best effort)
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor?.split(",")[0].trim() || "unknown"

    // Use admin client to bypass RLS for legal acceptance writes
    const adminSupabase = createAdminClient()

    // Upsert the acceptance
    const { data, error } = await adminSupabase
      .from("legal_acceptances")
      .upsert(
        {
          user_id: user.id,
          acceptance_type,
          version: CURRENT_TERMS_VERSION,
          accepted_at: new Date().toISOString(),
          ip_address: ipAddress,
        } as never,
        {
          onConflict: "user_id,acceptance_type",
        }
      )
      .select()
      .single()

    if (error) {
      console.error("Error saving legal acceptance:", error, { acceptance_type, user_id: user.id })
      return NextResponse.json({ error: "Failed to save acceptance" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error in POST /api/legal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
