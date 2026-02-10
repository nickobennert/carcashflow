-- =====================================================
-- FINALES PRODUCTION CLEANUP SCRIPT
-- Fahr mit! - Mitfahrbörse
-- =====================================================
--
-- Dieses Script:
-- 1. Löscht ALLE Demo-Daten
-- 2. Behält NUR den Super Admin User
-- 3. Entfernt alle Subscription-Spalten
-- 4. Entfernt nicht mehr benötigte Tabellen
--
-- =====================================================

-- =====================================================
-- SCHRITT 1: Finde den Super Admin User
-- =====================================================
-- Zeige erst alle Super Admins an:
SELECT
    sa.user_id,
    p.email,
    p.username,
    p.first_name
FROM super_admins sa
JOIN profiles p ON sa.user_id = p.id;

-- =====================================================
-- SCHRITT 2: DEMO-DATEN LÖSCHEN (außer Super Admin)
-- =====================================================

-- 2.1 Notifications löschen
DELETE FROM notifications;

-- 2.2 Messages löschen
DELETE FROM messages;

-- 2.3 Conversations löschen
DELETE FROM conversations;

-- 2.4 Route Watches löschen
DELETE FROM route_watches;

-- 2.5 Rides löschen
DELETE FROM rides;

-- 2.6 Reports löschen
DELETE FROM reports;

-- 2.7 Bug Reports löschen
DELETE FROM bug_reports;

-- 2.8 Legal Acceptances löschen (außer Super Admin)
DELETE FROM legal_acceptances
WHERE user_id NOT IN (SELECT user_id FROM super_admins);

-- 2.9 Alle Profile löschen AUSSER Super Admins
DELETE FROM profiles
WHERE id NOT IN (SELECT user_id FROM super_admins);

-- =====================================================
-- SCHRITT 3: NICHT MEHR BENÖTIGTE TABELLEN LÖSCHEN
-- =====================================================

-- 3.1 Promo Codes System entfernen
DROP TABLE IF EXISTS code_redemptions CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;

-- 3.2 Subscription Tiers Tabelle entfernen
DROP TABLE IF EXISTS subscription_tiers CASCADE;

-- 3.3 Connections Tabelle (falls nicht verwendet)
-- DROP TABLE IF EXISTS connections CASCADE;

-- =====================================================
-- SCHRITT 4: SUBSCRIPTION-SPALTEN AUS PROFILES ENTFERNEN
-- =====================================================

ALTER TABLE profiles
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS trial_ends_at,
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id,
DROP COLUMN IF EXISTS current_period_end,
DROP COLUMN IF EXISTS is_lifetime;

-- =====================================================
-- SCHRITT 5: is_banned SPALTE SICHERSTELLEN
-- =====================================================

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
-- SCHRITT 6: TRIGGER AKTUALISIEREN (ohne Subscription)
-- =====================================================

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
-- SCHRITT 7: AUTH USERS BEREINIGEN (OPTIONAL)
-- =====================================================
-- ACHTUNG: Dies löscht User aus Supabase Auth!
-- Nur ausführen wenn du sicher bist!

-- DELETE FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM super_admins);

-- =====================================================
-- SCHRITT 8: STATISTIK ANZEIGEN
-- =====================================================

SELECT 'profiles' as tabelle, COUNT(*) as anzahl FROM profiles
UNION ALL SELECT 'super_admins', COUNT(*) FROM super_admins
UNION ALL SELECT 'rides', COUNT(*) FROM rides
UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'route_watches', COUNT(*) FROM route_watches
UNION ALL SELECT 'reports', COUNT(*) FROM reports;

-- =====================================================
-- SCHRITT 9: VACUUM FÜR PERFORMANCE
-- =====================================================

VACUUM ANALYZE profiles;
VACUUM ANALYZE rides;
VACUUM ANALYZE conversations;
VACUUM ANALYZE messages;

-- =====================================================
-- FERTIG!
-- =====================================================
