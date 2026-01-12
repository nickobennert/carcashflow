-- Create reports table for user/content moderation
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'harassment', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Ensure at least one target is specified
  CHECK (reported_user_id IS NOT NULL OR reported_ride_id IS NOT NULL)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_ride ON reports(reported_ride_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own submitted reports
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own reports' AND tablename = 'reports') THEN
    CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
  END IF;
END $$;

-- Policy: Users can create reports
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create reports' AND tablename = 'reports') THEN
    CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
  END IF;
END $$;

-- Policy: Admins can view all reports (using super_admins table)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all reports' AND tablename = 'reports') THEN
    CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Policy: Admins can update reports
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update reports' AND tablename = 'reports') THEN
    CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Policy: Admins can delete reports
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete reports' AND tablename = 'reports') THEN
    CREATE POLICY "Admins can delete reports" ON reports FOR DELETE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Create super_admins table if not exists
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions JSONB DEFAULT '{}',
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for super_admins
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Policy: Only super_admins can view admin list
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view admin list' AND tablename = 'super_admins') THEN
    CREATE POLICY "Admins can view admin list" ON super_admins FOR SELECT USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid()));
  END IF;
END $$;

-- Policy: Only super_admin role can manage admins
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admins can manage admins' AND tablename = 'super_admins') THEN
    CREATE POLICY "Super admins can manage admins" ON super_admins FOR ALL USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid() AND sa.role = 'super_admin'));
  END IF;
END $$;
