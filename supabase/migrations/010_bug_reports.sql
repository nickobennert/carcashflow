-- Bug Reports Table for user feedback
-- Allows users to report bugs/issues and admins to track them

CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  area TEXT NOT NULL, -- 'dashboard', 'messages', 'profile', 'settings', 'other'
  screenshot_url TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
);

-- RLS Policies
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own bug reports
CREATE POLICY "Users can view own bug reports" ON bug_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create bug reports
CREATE POLICY "Users can create bug reports" ON bug_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all bug reports
CREATE POLICY "Admins can view all bug reports" ON bug_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- Admins can update bug reports
CREATE POLICY "Admins can update bug reports" ON bug_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- Admins can delete bug reports
CREATE POLICY "Admins can delete bug reports" ON bug_reports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- Create storage bucket for bug report screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-screenshots', 'bug-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload screenshots" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'bug-screenshots' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Anyone can view bug screenshots" ON storage.objects
  FOR SELECT USING (bucket_id = 'bug-screenshots');

CREATE POLICY "Admins can delete bug screenshots" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'bug-screenshots' AND
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_reports_updated_at();

-- Index for efficient queries
CREATE INDEX idx_bug_reports_user ON bug_reports(user_id);
CREATE INDEX idx_bug_reports_status ON bug_reports(status);
CREATE INDEX idx_bug_reports_created ON bug_reports(created_at DESC);
