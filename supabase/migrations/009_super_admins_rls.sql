-- Enable RLS on super_admins if not already enabled
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can check own admin status" ON super_admins;
  DROP POLICY IF EXISTS "Super admins can view all admins" ON super_admins;
  DROP POLICY IF EXISTS "Super admins can manage admins" ON super_admins;
END $$;

-- Allow users to check if they are an admin
CREATE POLICY "Users can check own admin status"
  ON super_admins
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow super admins to view all admins
CREATE POLICY "Super admins can view all admins"
  ON super_admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.user_id = auth.uid()
      AND sa.role IN ('super_admin', 'admin')
    )
  );

-- Allow super admins to manage other admins
CREATE POLICY "Super admins can manage admins"
  ON super_admins
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.user_id = auth.uid()
      AND sa.role = 'super_admin'
    )
  );
