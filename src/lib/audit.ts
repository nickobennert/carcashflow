import { createAdminClient } from "@/lib/supabase/admin"

export type AuditAction =
  | "user_banned"
  | "user_unbanned"
  | "report_resolved"
  | "report_dismissed"
  | "bug_status_changed"
  | "bug_report_deleted"
  | "ride_deleted"
  | "user_updated"

export type AuditTargetType = "user" | "ride" | "report" | "bug_report"

interface AuditLogEntry {
  admin_id: string
  action: AuditAction
  target_type: AuditTargetType
  target_id: string
  details?: Record<string, unknown>
}

/**
 * Log an admin action to the audit_log table.
 * Fire-and-forget: errors are logged but don't block the caller.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createAdminClient()

    await supabase.from("audit_log").insert({
      admin_id: entry.admin_id,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      details: entry.details || {},
    } as never)
  } catch (error) {
    // Don't throw — audit logging should never break the main flow
    console.error("[Audit] Failed to log event:", error, entry)
  }
}
