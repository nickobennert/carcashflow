-- Drop connections table (feature removed per customer request)
-- The connection/friendship system is no longer needed

-- First drop the trigger
DROP TRIGGER IF EXISTS connections_updated_at ON connections;

-- Drop the function
DROP FUNCTION IF EXISTS update_connections_updated_at();

-- Remove from realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS connections;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Drop the table (this will also drop indexes and policies)
DROP TABLE IF EXISTS connections;
