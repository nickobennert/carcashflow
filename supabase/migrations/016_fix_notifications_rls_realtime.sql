-- ============================================
-- Fix Notifications: Add missing RLS policies + Realtime
-- ============================================

-- 1. Add INSERT policy for notifications
-- Allows authenticated users to create notifications for OTHER users
-- (e.g., when sending a message, creating a ride match notification)
CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Add DELETE policy for notifications
-- Users can only delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Enable Realtime for notifications table
-- This allows the frontend to receive live updates via Supabase Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication, ignore
END $$;

-- ============================================
-- Run this migration in Supabase SQL Editor
--
-- Alternative for Realtime (if SQL doesn't work):
-- 1. Go to Supabase Dashboard > Database > Replication
-- 2. Under "supabase_realtime" publication, toggle ON for "notifications" table
-- ============================================
