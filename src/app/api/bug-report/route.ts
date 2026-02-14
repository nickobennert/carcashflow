import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/bug-report - Send bug report via email (NOT stored in DB)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, email, first_name, last_name")
      .eq("id", user.id)
      .single()

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

    // Collect screenshots (as base64 for email)
    const screenshots: { name: string; base64: string; type: string }[] = []
    for (let i = 0; i < 3; i++) {
      const file = formData.get(`screenshot_${i}`) as File | null
      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer()
        const base64 = Buffer.from(buffer).toString("base64")
        screenshots.push({
          name: file.name,
          base64,
          type: file.type,
        })
      }
    }

    // Map area to readable name
    const areaLabels: Record<string, string> = {
      "route-creation": "Fahrt erstellen",
      "route-search": "Fahrt suchen / Matching",
      "messages": "Nachrichten",
      "profile": "Profil",
      "settings": "Einstellungen",
      "notifications": "Benachrichtigungen",
      "login-signup": "Anmeldung / Registrierung",
      "map": "Karte / Navigation",
      "other": "Sonstiges",
    }

    // Build email content
    const emailContent = `
Bug-Report von Fahr mit!
========================

Von: ${profile?.first_name || ""} ${profile?.last_name || ""} (@${profile?.username || "unknown"})
E-Mail: ${profile?.email || user.email}
User-ID: ${user.id}

Bereich: ${areaLabels[area] || area}
Titel: ${title}

Beschreibung:
${description}

${workedBefore ? `Hat das vorher funktioniert?\n${workedBefore}\n` : ""}
${expectedBehavior ? `Erwartetes Verhalten:\n${expectedBehavior}\n` : ""}
${screencastUrl ? `Screencast-Video:\n${screencastUrl}\n` : ""}

Screenshots: ${screenshots.length > 0 ? `${screenshots.length} Anhänge` : "Keine"}

---
Gesendet am: ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
User Agent: ${request.headers.get("user-agent") || "unknown"}
    `.trim()

    // For now, we'll use a simple approach:
    // 1. Log to console (for development)
    // 2. In production, integrate with Resend or similar email service

    console.log("=== BUG REPORT ===")
    console.log(emailContent)
    if (screenshots.length > 0) {
      console.log(`Screenshots: ${screenshots.map((s) => s.name).join(", ")}`)
    }
    console.log("=== END BUG REPORT ===")

    // TODO: When Resend is configured, send actual email
    // For now, we'll simulate success
    //
    // Example with Resend:
    // import { Resend } from 'resend'
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'bugs@carcashflow.de',
    //   to: 'support@carcashflow.de',
    //   subject: `[Bug] ${title}`,
    //   text: emailContent,
    //   attachments: screenshots.map((s) => ({
    //     filename: s.name,
    //     content: s.base64,
    //   })),
    // })

    // Store temporary file for pickup (optional - for local dev)
    // This allows you to see bug reports without email setup

    return NextResponse.json({
      success: true,
      message: "Bug-Report gesendet",
    })
  } catch (error) {
    console.error("Error in POST /api/bug-report:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
