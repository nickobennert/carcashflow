-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percent_discount', 'fixed_discount', 'free_months', 'lifetime_free')),
  value INTEGER, -- percentage for percent_discount, cents for fixed_discount, months for free_months
  duration_months INTEGER, -- how long the discount applies
  max_uses INTEGER, -- null for unlimited
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ, -- null for no expiration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create code_redemptions table to track who redeemed what
CREATE TABLE IF NOT EXISTS code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent double redemption
  UNIQUE(code_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_code_redemptions_user ON code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_code ON code_redemptions(code_id);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies for promo_codes
-- Anyone can view active promo codes (needed for validation)
CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes
  FOR SELECT
  USING (is_active = true);

-- Admins can view all promo codes
CREATE POLICY "Admins can view all promo codes"
  ON promo_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

-- Admins can create promo codes
CREATE POLICY "Admins can create promo codes"
  ON promo_codes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

-- Admins can update promo codes
CREATE POLICY "Admins can update promo codes"
  ON promo_codes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

-- Policies for code_redemptions
-- Users can view their own redemptions
CREATE POLICY "Users can view own redemptions"
  ON code_redemptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create redemptions (redeem codes)
CREATE POLICY "Users can redeem codes"
  ON code_redemptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all redemptions
CREATE POLICY "Admins can view all redemptions"
  ON code_redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

-- Function to increment promo code usage
CREATE OR REPLACE FUNCTION increment_promo_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE id = NEW.code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment usage on redemption
DROP TRIGGER IF EXISTS on_code_redemption ON code_redemptions;
CREATE TRIGGER on_code_redemption
  AFTER INSERT ON code_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION increment_promo_code_usage();
