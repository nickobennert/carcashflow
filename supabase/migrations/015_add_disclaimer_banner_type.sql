-- ============================================
-- Add disclaimer_banner to legal_acceptances acceptance_type
-- ============================================

-- First, drop the existing constraint
ALTER TABLE legal_acceptances DROP CONSTRAINT IF EXISTS legal_acceptances_acceptance_type_check;

-- Add new constraint with disclaimer_banner included
ALTER TABLE legal_acceptances ADD CONSTRAINT legal_acceptances_acceptance_type_check
  CHECK (acceptance_type IN ('rideshare_terms', 'privacy_policy', 'terms_of_service', 'disclaimer_banner'));

-- Comment
COMMENT ON COLUMN legal_acceptances.acceptance_type IS 'Type of legal acceptance: rideshare_terms, privacy_policy, terms_of_service, or disclaimer_banner';
