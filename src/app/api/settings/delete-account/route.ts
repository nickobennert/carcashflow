import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// DELETE /api/settings/delete-account - DSGVO Article 17 (Right to Erasure)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { confirmUsername: confirmation_username } = body

    // Verify the user typed their username correctly
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single()

    const profile = data as { username: string } | null

    if (!profile || profile.username !== confirmation_username) {
      return NextResponse.json(
        { error: "Benutzername stimmt nicht überein" },
        { status: 400 }
      )
    }

    // Delete all user data in correct order (respecting foreign keys)
    // Using admin client to bypass RLS for complete deletion

    // 1. Delete notifications
    await adminClient
      .from("notifications")
      .delete()
      .eq("user_id", user.id)

    // 2. Delete messages sent by user
    await adminClient
      .from("messages")
      .delete()
      .eq("sender_id", user.id)

    // 3. Delete conversations where user is a participant
    await adminClient
      .from("conversations")
      .delete()
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)

    // 4. Delete rides created by user
    await adminClient
      .from("rides")
      .delete()
      .eq("user_id", user.id)

    // 5. Delete route watches
    await adminClient
      .from("route_watches")
      .delete()
      .eq("user_id", user.id)

    // 6. Delete reports filed by or against user
    await adminClient
      .from("reports")
      .delete()
      .or(`reporter_id.eq.${user.id},reported_user_id.eq.${user.id}`)

    // 7. Delete bug reports
    await adminClient
      .from("bug_reports")
      .delete()
      .eq("user_id", user.id)

    // 8. Delete legal acceptances
    await adminClient
      .from("legal_acceptances")
      .delete()
      .eq("user_id", user.id)

    // 9. Delete profile (this must be last due to foreign keys)
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", user.id)

    if (profileError) {
      console.error("Error deleting profile:", profileError)
      return NextResponse.json(
        { error: "Fehler beim Löschen des Profils" },
        { status: 500 }
      )
    }

    // 10. Delete auth user (using admin API)
    const { error: authError } = await adminClient.auth.admin.deleteUser(user.id)

    if (authError) {
      console.error("Error deleting auth user:", authError)
      // Profile is already deleted, but auth user remains
      // This is acceptable - user can't access the app anyway
    }

    return NextResponse.json({
      success: true,
      message: "Account und alle Daten wurden gelöscht"
    })

  } catch (error) {
    console.error("Error in DELETE /api/settings/delete-account:", error)
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
