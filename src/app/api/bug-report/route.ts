import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST /api/bug-report - Create a new bug report (stored in DB)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()

    const title = formData.get("title") as string
    const area = formData.get("area") as string
    const description = formData.get("description") as string
    const workedBefore = formData.get("workedBefore") as string | null
    const expectedBehavior = formData.get("expectedBehavior") as string | null
    const screencastUrl = formData.get("screencastUrl") as string | null

    // Validate required fields
    if (!title || !area || !description) {
      return NextResponse.json(
        { error: "Titel, Bereich und Beschreibung sind erforderlich" },
        { status: 400 }
      )
    }

    // Upload screenshots to Supabase Storage
    const screenshotUrls: string[] = []
    for (let i = 0; i < 3; i++) {
      const file = formData.get(`screenshot_${i}`) as File | null
      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer()
        const fileName = `bug-reports/${user.id}/${Date.now()}_${i}_${file.name}`

        const { data: uploadData, error: uploadError } = await adminClient.storage
          .from("uploads")
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          console.error("Error uploading screenshot:", uploadError)
          continue
        }

        // Get public URL
        const { data: urlData } = adminClient.storage
          .from("uploads")
          .getPublicUrl(uploadData.path)

        if (urlData?.publicUrl) {
          screenshotUrls.push(urlData.publicUrl)
        }
      }
    }

    // Store bug report in database
    const { data: bugReport, error } = await adminClient
      .from("bug_reports")
      .insert({
        user_id: user.id,
        title,
        area,
        description,
        worked_before: workedBefore || null,
        expected_behavior: expectedBehavior || null,
        screencast_url: screencastUrl || null,
        screenshots: screenshotUrls.length > 0 ? screenshotUrls : null,
        status: "open",
        user_agent: request.headers.get("user-agent") || null,
      } as never)
      .select()
      .single()

    if (error) {
      console.error("Error creating bug report:", error)
      return NextResponse.json(
        { error: "Fehler beim Speichern des Bug-Reports" },
        { status: 500 }
      )
    }

    const report = bugReport as { id: string }

    return NextResponse.json({
      success: true,
      message: "Bug-Report gesendet",
      id: report.id,
    })
  } catch (error) {
    console.error("Error in POST /api/bug-report:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}

// GET /api/bug-report - Get all bug reports (admin only)
export async function GET() {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminData } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!adminData) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all bug reports with user info
    const { data: bugReports, error } = await adminClient
      .from("bug_reports")
      .select(`
        *,
        user:profiles!bug_reports_user_id_fkey (
          id, username, first_name, last_name, email, avatar_url
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bug reports:", error)
      return NextResponse.json(
        { error: "Fehler beim Laden der Bug-Reports" },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: bugReports })
  } catch (error) {
    console.error("Error in GET /api/bug-report:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
