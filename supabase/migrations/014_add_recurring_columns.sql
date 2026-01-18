-- ============================================
-- Add recurring ride columns to rides table
-- These columns were missing from the original schema
-- ============================================

-- Add is_recurring column
ALTER TABLE rides ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Add recurring_days column (array of day numbers 0-6, where 0 = Sunday)
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_days INTEGER[];

-- Add recurring_until column (end date for recurring rides)
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_until DATE;

-- Add parent_ride_id for linking child recurring rides to parent
ALTER TABLE rides ADD COLUMN IF NOT EXISTS parent_ride_id UUID REFERENCES rides(id) ON DELETE CASCADE;

-- Create index for recurring rides
CREATE INDEX IF NOT EXISTS idx_rides_recurring ON rides(is_recurring) WHERE is_recurring = TRUE;

-- Create index for parent-child relationship
CREATE INDEX IF NOT EXISTS idx_rides_parent ON rides(parent_ride_id) WHERE parent_ride_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN rides.is_recurring IS 'Whether this ride repeats on a weekly schedule';
COMMENT ON COLUMN rides.recurring_days IS 'Array of weekday numbers (0=Sun, 1=Mon, ..., 6=Sat) for recurring rides';
COMMENT ON COLUMN rides.recurring_until IS 'End date for recurring ride series';
COMMENT ON COLUMN rides.parent_ride_id IS 'Reference to parent ride for recurring ride instances';
