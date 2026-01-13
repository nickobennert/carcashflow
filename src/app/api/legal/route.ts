import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

const CURRENT_TERMS_VERSION = "1.0"

// GET /api/legal - Check if user has accepted current terms
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has accepted the current version of rideshare terms
    const { data: acceptanceData, error } = await supabase
      .from("legal_acceptances")
      .select("id, version, accepted_at")
      .eq("user_id", user.id)
      .eq("acceptance_type", "rideshare_terms")
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

    // Get client IP (best effort)
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor?.split(",")[0].trim() || "unknown"

    // Upsert the acceptance
    const { data, error } = await supabase
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
      console.error("Error saving legal acceptance:", error)
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
