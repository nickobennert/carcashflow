import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/e2e/keys - Get current user's public key or another user's public key
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id") || user.id

    // Get public key for the specified user
    const { data: keyData, error } = await supabase
      .from("user_public_keys")
      .select("user_id, public_key, fingerprint, created_at")
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching public key:", error)
      return NextResponse.json({ error: "Failed to fetch public key" }, { status: 500 })
    }

    if (!keyData) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json({ data: keyData })
  } catch (error) {
    console.error("Error in GET /api/e2e/keys:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/e2e/keys - Register or update user's public key
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
    const { public_key, fingerprint } = body

    if (!public_key || !fingerprint) {
      return NextResponse.json(
        { error: "public_key and fingerprint are required" },
        { status: 400 }
      )
    }

    // Validate public key format (basic check - should be base64)
    if (!/^[A-Za-z0-9+/]+=*$/.test(public_key)) {
      return NextResponse.json(
        { error: "Invalid public key format" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Upsert the public key
    const { data: keyData, error } = await adminClient
      .from("user_public_keys")
      .upsert(
        {
          user_id: user.id,
          public_key,
          fingerprint,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "user_id" }
      )
      .select()
      .single()

    if (error) {
      console.error("Error storing public key:", error)
      return NextResponse.json({ error: "Failed to store public key" }, { status: 500 })
    }

    return NextResponse.json({ data: keyData }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/e2e/keys:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/e2e/keys - Delete user's public key (for key rotation)
export async function DELETE() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Delete the public key
    const { error } = await adminClient
      .from("user_public_keys")
      .delete()
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting public key:", error)
      return NextResponse.json({ error: "Failed to delete public key" }, { status: 500 })
    }

    // Also delete all conversation keys involving this user
    await adminClient
      .from("conversation_keys")
      .delete()
      .eq("user_id", user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/e2e/keys:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
