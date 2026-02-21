-- =====================================================
-- DEMO-DATEN LÖSCHEN (ohne Schema-Änderungen)
-- =====================================================
--
-- Dieses Script löscht nur Daten, keine Tabellen/Spalten.
-- Sicher für wiederholte Ausführung.
--
-- =====================================================

BEGIN;

-- Reihenfolge wichtig wegen Foreign Keys!

-- 1. Notifications
DELETE FROM notifications;
SELECT 'Notifications gelöscht: ' || COUNT(*) FROM notifications;

-- 2. Messages
DELETE FROM messages;
SELECT 'Messages gelöscht: ' || COUNT(*) FROM messages;

-- 3. Conversations
DELETE FROM conversations;
SELECT 'Conversations gelöscht: ' || COUNT(*) FROM conversations;

-- 4. Route Watches
DELETE FROM route_watches;
SELECT 'Route Watches gelöscht: ' || COUNT(*) FROM route_watches;

-- 5. Rides
DELETE FROM rides;
SELECT 'Rides gelöscht: ' || COUNT(*) FROM rides;

-- 6. Reports
DELETE FROM reports;
SELECT 'Reports gelöscht: ' || COUNT(*) FROM reports;

-- 7. Bug Reports
DELETE FROM bug_reports;
SELECT 'Bug Reports gelöscht: ' || COUNT(*) FROM bug_reports;

-- 8. Legal Acceptances
DELETE FROM legal_acceptances;
SELECT 'Legal Acceptances gelöscht: ' || COUNT(*) FROM legal_acceptances;

-- 9. (Promo Codes / Code Redemptions wurden entfernt - Tabellen existieren nicht mehr)

COMMIT;

-- Statistik ausgeben
SELECT
    'profiles' as tabelle, COUNT(*) as anzahl FROM profiles
UNION ALL
SELECT 'rides', COUNT(*) FROM rides
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'route_watches', COUNT(*) FROM route_watches
UNION ALL
SELECT 'reports', COUNT(*) FROM reports;
