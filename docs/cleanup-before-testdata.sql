-- ============================================================
-- DB Cleanup: Alles löschen AUSSER die 4 echten User
-- Vor dem Einfügen der Test-Daten ausführen!
-- ============================================================

-- Die 4 echten User-IDs (aus Supabase Auth):
-- Thomas:  monkeeschoice@gmail.com
-- Sascha:  hello@saschathiel.com
-- Nicko:   nicko-bennert@web.de
-- Luzian:  info@luzian-strehl.de

-- Schritt 1: Alle Nachrichten löschen
DELETE FROM messages;

-- Schritt 2: Alle Conversations löschen (nutzt participant_1/participant_2, keine separate Tabelle)
DELETE FROM conversations;

-- Schritt 4: Alle Notifications löschen
DELETE FROM notifications;

-- Schritt 5: Alle Rides löschen (auch von echten Usern - fresh start)
DELETE FROM rides;

-- Schritt 6: Alle Reports löschen
DELETE FROM reports;

-- Schritt 7: Alle Code Redemptions löschen
DELETE FROM code_redemptions;

-- Schritt 8: Alle Legal Acceptances löschen (User müssen neu akzeptieren)
DELETE FROM legal_acceptances;

-- Schritt 9: Profiles löschen die NICHT zu den 4 echten Usern gehören
DELETE FROM profiles
WHERE email NOT IN (
  'monkeeschoice@gmail.com',
  'hello@saschathiel.com',
  'nicko-bennert@web.de',
  'info@luzian-strehl.de'
);

-- Schritt 10: Auth-User löschen die NICHT zu den 4 echten Usern gehören
-- ACHTUNG: Dies muss über die Supabase Admin API oder Dashboard erfolgen,
-- da auth.users nicht direkt per SQL gelöscht werden kann.
-- Alternative: Im Supabase Dashboard > Authentication > Users manuell löschen.

-- Verifizierung: Nur noch 4 User übrig?
SELECT id, email, first_name, username FROM profiles ORDER BY created_at;
