-- ============================================
-- Add route_geometry column to rides table
-- Stores the actual road path from OSRM routing
-- ============================================

-- Add column for storing route geometry (array of [lat, lng] coordinates)
-- This stores the actual road path, not just waypoints
ALTER TABLE rides ADD COLUMN IF NOT EXISTS route_geometry JSONB;

-- Add column for storing route metadata (distance, duration)
ALTER TABLE rides ADD COLUMN IF NOT EXISTS route_distance INTEGER; -- distance in meters
ALTER TABLE rides ADD COLUMN IF NOT EXISTS route_duration INTEGER; -- duration in seconds

-- Create index for geometry queries (optional, for future spatial queries)
CREATE INDEX IF NOT EXISTS idx_rides_has_geometry ON rides((route_geometry IS NOT NULL)) WHERE status = 'active';

-- Comment explaining the columns
COMMENT ON COLUMN rides.route_geometry IS 'Array of [lat, lng] coordinates representing the actual road path from OSRM routing';
COMMENT ON COLUMN rides.route_distance IS 'Total route distance in meters, calculated by OSRM';
COMMENT ON COLUMN rides.route_duration IS 'Estimated route duration in seconds, calculated by OSRM';
