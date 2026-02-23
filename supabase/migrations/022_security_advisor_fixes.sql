-- ============================================
-- SECURITY ADVISOR FIXES
-- Fixes 4 warnings from Supabase Security Advisor
-- ============================================

-- ============================================
-- FIX 1: handle_new_user - search_path mutable
-- Migration 999 overwrote the secure version from 017
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, webhook_token, created_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    gen_random_uuid(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;


-- ============================================
-- FIX 2: audit_log - RLS Policy Always True
-- Drop overly permissive policies, add admin-only read
-- All writes happen via service_role (bypasses RLS)
-- ============================================

-- Drop all existing policies on audit_log
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'audit_log' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.audit_log', pol.policyname);
  END LOOP;
END $$;

-- Admin-only read access (via super_admins table)
CREATE POLICY "Admins can view audit log"
  ON public.audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies needed
-- All writes happen server-side via service_role which bypasses RLS


-- ============================================
-- FIX 3: notifications - RLS Policy Always True (x2)
-- Two INSERT policies use WITH CHECK (true)
-- All notification inserts use adminClient (service_role)
-- so no client INSERT policy is needed
-- ============================================

-- Drop the two overly permissive INSERT policies
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Existing SELECT/UPDATE/DELETE policies are correct:
-- "Users can view own notifications" - USING (auth.uid() = user_id)
-- "Users can update own notifications" - USING (auth.uid() = user_id)
-- "Users can delete own notifications" - USING (auth.uid() = user_id)


-- ============================================
-- DONE - Expected result: 0 Security Advisor warnings
-- ============================================
