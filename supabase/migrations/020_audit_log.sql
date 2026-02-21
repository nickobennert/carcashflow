-- =====================================================
-- AUDIT LOG - Admin-Aktionen protokollieren
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,          -- 'user_banned', 'user_unbanned', 'report_resolved', 'bug_status_changed', etc.
  target_type TEXT NOT NULL,     -- 'user', 'ride', 'report', 'bug_report'
  target_id TEXT NOT NULL,       -- UUID of the affected entity
  details JSONB DEFAULT '{}',   -- Additional context (e.g. old_status, new_status)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

-- Only service role can insert (via API)
CREATE POLICY "Service role can insert audit logs"
  ON audit_log
  FOR INSERT
  WITH CHECK (true);
