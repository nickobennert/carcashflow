import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]

// POST /api/messages/upload - Upload attachment for a message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const conversationId = formData.get("conversation_id") as string | null

    if (!file) {
      return NextResponse.json({ error: "Keine Datei angegeben" }, { status: 400 })
    }

    if (!conversationId) {
      return NextResponse.json({ error: "conversation_id erforderlich" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Dateityp nicht erlaubt. Erlaubt: JPG, PNG, GIF, WebP, PDF" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Datei zu groß. Maximal 5MB erlaubt." },
        { status: 400 }
      )
    }

    // Verify user is participant of conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2")
      .eq("id", conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const conv = conversation as { id: string; participant_1: string; participant_2: string }
    if (conv.participant_1 !== user.id && conv.participant_2 !== user.id) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 })
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop() || "bin"
    const fileName = `${conversationId}/${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("message-attachments")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("message-attachments")
      .getPublicUrl(fileName)

    const attachmentType = file.type.startsWith("image/") ? "image" : "file"

    return NextResponse.json({
      url: publicUrl,
      type: attachmentType,
      name: file.name,
    })
  } catch (error) {
    console.error("Error in message upload:", error)
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 })
  }
}
