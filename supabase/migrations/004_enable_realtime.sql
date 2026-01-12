-- ============================================
-- Enable Realtime for Messages
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable realtime for the messages table
-- This allows clients to subscribe to INSERT/UPDATE/DELETE events

-- Add messages table to the realtime publication
-- Note: Use BEGIN/EXCEPTION block to handle if table is already in publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication, ignore
END $$;

-- Also enable for conversations (for updated_at changes)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication, ignore
END $$;

-- ============================================
-- Alternative: If the above doesn't work, you can enable it via Supabase Dashboard:
-- 1. Go to Database > Replication
-- 2. Under "supabase_realtime" publication, toggle ON for "messages" table
-- 3. Toggle ON for "conversations" table
-- ============================================
