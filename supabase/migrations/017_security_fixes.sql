-- ============================================
-- SECURITY FIXES - Search Path & RLS
-- ============================================

-- SCHRITT 1: Funktionen mit sicherem search_path neu erstellen
-- ============================================

-- 1.1 handle_new_user (Auth Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTRING(NEW.id::text, 1, 4)
  );
  RETURN NEW;
END;
$$;

-- 1.2 update_updated_at_column (Generic Trigger)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1.3 update_rides_updated_at
CREATE OR REPLACE FUNCTION public.update_rides_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1.4 update_route_watches_updated_at
CREATE OR REPLACE FUNCTION public.update_route_watches_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1.5 update_bug_reports_updated_at
CREATE OR REPLACE FUNCTION public.update_bug_reports_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1.6 expire_old_rides (Cron Job Function)
CREATE OR REPLACE FUNCTION public.expire_old_rides()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.rides
  SET status = 'expired'
  WHERE status = 'active'
    AND departure_date < CURRENT_DATE - INTERVAL '1 day';
END;
$$;

-- 1.7 Drop increment_promo_code_usage (nicht mehr benötigt)
DROP FUNCTION IF EXISTS public.increment_promo_code_usage();


-- SCHRITT 2: RLS Policy für Notifications fixen
-- ============================================

-- Alte "always true" Policies entfernen
DROP POLICY IF EXISTS "Enable realtime for notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow realtime" ON public.notifications;

-- Sichere Policies erstellen
-- Users können nur ihre eigenen Notifications sehen
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users können nur ihre eigenen Notifications als gelesen markieren
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users können ihre eigenen Notifications löschen
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- System kann Notifications erstellen (via service role)
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);


-- SCHRITT 3: Realtime für Notifications mit Filter
-- ============================================
-- Supabase Realtime verwendet RLS automatisch, daher keine separate Policy nötig


-- ============================================
-- FERTIG!
-- ============================================
