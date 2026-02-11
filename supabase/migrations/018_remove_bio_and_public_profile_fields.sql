-- Migration: Remove bio and is_public fields from profiles
-- These fields were part of the public profiles feature which has been removed

-- Remove bio column (user description/about me)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bio;

-- Remove is_public column (public profile visibility toggle)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_public;

-- Note: Run this migration in Supabase Dashboard > SQL Editor
-- After running, also manually delete demo Auth users in Authentication > Users
-- Keep only: Sascha Thiel (hello@saschathiel.com)
