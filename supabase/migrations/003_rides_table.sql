-- ============================================
-- Rides Table for Route Sharing
-- Run this in Supabase SQL Editor
-- ============================================

-- Create rides table
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Type: offer (has car, giving rides) or request (needs ride)
  type TEXT NOT NULL CHECK (type IN ('offer', 'request')),

  -- Route stored as JSONB array of waypoints
  -- Each point: { type: "start"|"stop"|"end", address: string, lat: number, lng: number, order: number }
  route JSONB NOT NULL DEFAULT '[]',

  -- Timing
  departure_date DATE NOT NULL,
  departure_time TIME,

  -- For offers: how many seats available
  seats_available INTEGER DEFAULT 1 CHECK (seats_available >= 1 AND seats_available <= 8),

  -- Optional comment/notes
  comment TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),

  -- Auto-expire rides after X days
  expires_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_rides_user ON rides(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_rides_departure ON rides(departure_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_rides_type ON rides(type) WHERE status = 'active';

-- Enable RLS
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone authenticated can view active rides
CREATE POLICY "Anyone can view active rides"
  ON rides
  FOR SELECT
  TO authenticated
  USING (status = 'active' AND departure_date >= CURRENT_DATE);

-- Users can view their own rides (any status)
CREATE POLICY "Users can view their own rides"
  ON rides
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own rides
CREATE POLICY "Users can create rides"
  ON rides
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own rides
CREATE POLICY "Users can update their own rides"
  ON rides
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own rides
CREATE POLICY "Users can delete their own rides"
  ON rides
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_rides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rides_updated_at ON rides;
CREATE TRIGGER rides_updated_at
  BEFORE UPDATE ON rides
  FOR EACH ROW
  EXECUTE FUNCTION update_rides_updated_at();

-- Function to auto-expire old rides (can be called by cron/edge function)
CREATE OR REPLACE FUNCTION expire_old_rides()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE rides
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND (
      expires_at < NOW()
      OR departure_date < CURRENT_DATE
    );

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
