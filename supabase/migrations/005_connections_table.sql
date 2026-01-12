-- Create connections table for friend/connection system
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure unique connection pairs
  UNIQUE(requester_id, addressee_id),

  -- Prevent self-connections
  CHECK (requester_id != addressee_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

-- Composite index for finding connections between two users
CREATE INDEX IF NOT EXISTS idx_connections_users ON connections(requester_id, addressee_id);

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own connections (sent or received)
CREATE POLICY "Users can view own connections"
  ON connections
  FOR SELECT
  USING (
    auth.uid() = requester_id OR
    auth.uid() = addressee_id
  );

-- Policy: Users can create connection requests
CREATE POLICY "Users can create connection requests"
  ON connections
  FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id AND
    requester_id != addressee_id
  );

-- Policy: Users can update connections they're part of
-- Requester can cancel pending, Addressee can accept/reject
CREATE POLICY "Users can update own connections"
  ON connections
  FOR UPDATE
  USING (
    auth.uid() = requester_id OR
    auth.uid() = addressee_id
  )
  WITH CHECK (
    auth.uid() = requester_id OR
    auth.uid() = addressee_id
  );

-- Policy: Users can delete their own connection requests or accepted connections
CREATE POLICY "Users can delete own connections"
  ON connections
  FOR DELETE
  USING (
    auth.uid() = requester_id OR
    auth.uid() = addressee_id
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS connections_updated_at ON connections;
CREATE TRIGGER connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connections_updated_at();

-- Enable realtime for connections
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE connections;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
