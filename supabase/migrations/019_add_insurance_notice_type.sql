-- ============================================
-- Add insurance_notice to legal_acceptances acceptance_type
-- ============================================

-- Drop existing constraint
ALTER TABLE legal_acceptances DROP CONSTRAINT IF EXISTS legal_acceptances_acceptance_type_check;

-- Add new constraint with insurance_notice included
ALTER TABLE legal_acceptances ADD CONSTRAINT legal_acceptances_acceptance_type_check
  CHECK (acceptance_type IN ('rideshare_terms', 'privacy_policy', 'terms_of_service', 'disclaimer_banner', 'insurance_notice'));

-- Comment
COMMENT ON COLUMN legal_acceptances.acceptance_type IS 'Type of legal acceptance: rideshare_terms, privacy_policy, terms_of_service, disclaimer_banner, or insurance_notice';
