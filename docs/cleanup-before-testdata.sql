-- ============================================================
-- DB Cleanup: Alles löschen AUSSER die 4 echten User
-- Vor dem Einfügen der Test-Daten ausführen!
-- ============================================================

-- Die 4 echten User-Emails:
-- Thomas:  monkeeschoice@gmail.com
-- Sascha:  hello@saschathiel.com
-- Nicko:   nicko-bennert@web.de
-- Luzian:  info@luzian-strehl.de

-- Schritt 1: Alle Nachrichten löschen
DELETE FROM messages;

-- Schritt 2: Alle Conversations löschen
DELETE FROM conversations;

-- Schritt 3: Alle Notifications löschen
DELETE FROM notifications;

-- Schritt 4: Alle Rides löschen (fresh start)
DELETE FROM rides;

-- Schritt 5: Alle Reports löschen
DELETE FROM reports;

-- Schritt 6: Alle Legal Acceptances löschen
DELETE FROM legal_acceptances;

-- Schritt 7: Profiles löschen die NICHT zu den 4 echten Usern gehören
DELETE FROM profiles
WHERE email NOT IN (
  'monkeeschoice@gmail.com',
  'hello@saschathiel.com',
  'nicko-bennert@web.de',
  'info@luzian-strehl.de'
);

-- Schritt 8: Auth-User löschen die NICHT zu den 4 echten Usern gehören
-- ACHTUNG: Dies muss im Supabase Dashboard > Authentication > Users manuell erfolgen,
-- da auth.users nicht direkt per SQL gelöscht werden kann.

-- Verifizierung: Nur noch 4 User übrig?
SELECT id, email, first_name, username FROM profiles ORDER BY created_at;
