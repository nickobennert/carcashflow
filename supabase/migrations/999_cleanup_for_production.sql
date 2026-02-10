-- =====================================================
-- PRODUCTION CLEANUP SCRIPT
-- Fahr mit! - Mitfahrbörse
-- =====================================================
--
-- WARNUNG: Dieses Script löscht ALLE Demodaten und nicht mehr
-- benötigte Tabellen/Spalten. NUR IN PRODUKTION AUSFÜHREN wenn
-- die App bereit für den Launch ist!
--
-- Ausführungsreihenfolge beachten (Foreign Keys)!
-- =====================================================

-- =====================================================
-- TEIL 1: DEMO-DATEN LÖSCHEN
-- =====================================================

-- 1.1 Notifications löschen
TRUNCATE TABLE notifications CASCADE;

-- 1.2 Messages löschen
TRUNCATE TABLE messages CASCADE;

-- 1.3 Conversations löschen
TRUNCATE TABLE conversations CASCADE;

-- 1.4 Route Watches löschen
TRUNCATE TABLE route_watches CASCADE;

-- 1.5 Rides löschen
TRUNCATE TABLE rides CASCADE;

-- 1.6 Reports löschen
TRUNCATE TABLE reports CASCADE;

-- 1.7 Bug Reports löschen (falls vorhanden)
TRUNCATE TABLE bug_reports CASCADE;

-- 1.8 Legal Acceptances löschen
TRUNCATE TABLE legal_acceptances CASCADE;

-- 1.9 Connections löschen (falls vorhanden)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connections') THEN
        TRUNCATE TABLE connections CASCADE;
    END IF;
END $$;

-- 1.10 Code Redemptions löschen (falls vorhanden)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'code_redemptions') THEN
        TRUNCATE TABLE code_redemptions CASCADE;
    END IF;
END $$;

-- =====================================================
-- TEIL 2: NICHT MEHR BENÖTIGTE TABELLEN LÖSCHEN
-- =====================================================

-- 2.1 Promo Codes System entfernen (Subscription wurde deaktiviert)
DROP TABLE IF EXISTS code_redemptions CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;

-- 2.2 Subscription Tiers Referenz-Tabelle entfernen
DROP TABLE IF EXISTS subscription_tiers CASCADE;

-- =====================================================
-- TEIL 3: SUBSCRIPTION-SPALTEN AUS PROFILES ENTFERNEN
-- =====================================================

-- 3.1 Subscription-bezogene Spalten entfernen
ALTER TABLE profiles
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS trial_ends_at,
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id,
DROP COLUMN IF EXISTS current_period_end,
DROP COLUMN IF EXISTS is_lifetime;

-- =====================================================
-- TEIL 4: is_banned SPALTE HINZUFÜGEN (falls nicht vorhanden)
-- =====================================================

-- 4.1 is_banned Spalte für User-Sperrung
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'is_banned'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- =====================================================
-- TEIL 5: PROFILES TRIGGER AKTUALISIEREN
-- =====================================================

-- 5.1 Trigger-Funktion aktualisieren (ohne Subscription-Felder)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTRING(NEW.id::text, 1, 4)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TEIL 6: TEST-USER PROFILE LÖSCHEN (OPTIONAL)
-- =====================================================
-- Entkommentieren um alle Test-User zu löschen
-- ACHTUNG: Löscht auch den Auth-User nicht automatisch!

-- DELETE FROM profiles WHERE email LIKE '%test%' OR email LIKE '%demo%';

-- =====================================================
-- TEIL 7: SUPER_ADMINS BEHALTEN ABER BEREINIGEN
-- =====================================================
-- Super Admins Tabelle nicht löschen - wird für Admin-Bereich benötigt
-- Optional: Test-Admins entfernen

-- DELETE FROM super_admins WHERE user_id NOT IN (
--   SELECT id FROM profiles WHERE email = 'dein-admin@email.de'
-- );

-- =====================================================
-- TEIL 8: STATISTIKEN AKTUALISIEREN
-- =====================================================

-- Vacuum und Analyze für bessere Performance
VACUUM ANALYZE profiles;
VACUUM ANALYZE rides;
VACUUM ANALYZE conversations;
VACUUM ANALYZE messages;
VACUUM ANALYZE notifications;
VACUUM ANALYZE route_watches;

-- =====================================================
-- FERTIG!
-- =====================================================
--
-- Nach Ausführung:
-- 1. Prüfe ob alle Tabellen korrekt geleert wurden
-- 2. Erstelle einen Admin-User in super_admins
-- 3. Teste Login/Signup Flow
-- 4. Fülle Datenschutzerklärung aus (src/app/datenschutz/page.tsx)
--
-- =====================================================
