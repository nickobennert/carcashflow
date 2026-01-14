import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/bug-reports/upload - Upload a screenshot
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "png"
    const filename = `${user.id}/${Date.now()}.${ext}`

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("bug-screenshots")
      .upload(filename, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("Error uploading screenshot:", error)
      return NextResponse.json({ error: "Failed to upload screenshot" }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("bug-screenshots")
      .getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("Error in POST /api/bug-reports/upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
