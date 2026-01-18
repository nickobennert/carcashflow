-- =============================================
-- Route Watches Table
-- Allows users to save location/route watches for notifications
-- =============================================

-- Create route_watches table
CREATE TABLE IF NOT EXISTS route_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Type: location (single point + radius) or route (start + end)
  type TEXT NOT NULL CHECK (type IN ('location', 'route')),
  name TEXT NOT NULL,

  -- For Location-based watches (single point with radius)
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  radius_km INTEGER DEFAULT 25 CHECK (radius_km >= 1 AND radius_km <= 100),

  -- For Route-based watches (start + end points)
  start_lat DECIMAL(10, 8),
  start_lng DECIMAL(11, 8),
  start_address TEXT,
  end_lat DECIMAL(10, 8),
  end_lng DECIMAL(11, 8),
  end_address TEXT,

  -- Filter preferences
  ride_type TEXT DEFAULT 'both' CHECK (ride_type IN ('offer', 'request', 'both')),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Notification preferences
  push_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT false,

  -- Tracking stats
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_location_watch CHECK (
    type != 'location' OR (
      location_lat IS NOT NULL AND
      location_lng IS NOT NULL AND
      location_address IS NOT NULL
    )
  ),
  CONSTRAINT valid_route_watch CHECK (
    type != 'route' OR (
      start_lat IS NOT NULL AND
      start_lng IS NOT NULL AND
      start_address IS NOT NULL AND
      end_lat IS NOT NULL AND
      end_lng IS NOT NULL AND
      end_address IS NOT NULL
    )
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_route_watches_user_active
  ON route_watches(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_route_watches_location
  ON route_watches(location_lat, location_lng)
  WHERE type = 'location' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_route_watches_route_start
  ON route_watches(start_lat, start_lng)
  WHERE type = 'route' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_route_watches_route_end
  ON route_watches(end_lat, end_lng)
  WHERE type = 'route' AND is_active = true;

-- Enable Row Level Security
ALTER TABLE route_watches ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own watches
CREATE POLICY "Users can view own watches"
  ON route_watches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watches"
  ON route_watches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watches"
  ON route_watches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watches"
  ON route_watches FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_route_watches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER route_watches_updated_at
  BEFORE UPDATE ON route_watches
  FOR EACH ROW
  EXECUTE FUNCTION update_route_watches_updated_at();

-- Add push_subscription field to profiles for Web Push
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Enable realtime for route_watches
ALTER PUBLICATION supabase_realtime ADD TABLE route_watches;

-- Comment
COMMENT ON TABLE route_watches IS 'Stores user route/location watches for ride notifications';
