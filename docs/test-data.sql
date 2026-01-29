-- ============================================================
-- CARCASHFLOW TEST DATA
-- ============================================================
-- Dieses Script erstellt Testdaten für das Route-Matching.
-- Ausführen in Supabase SQL Editor (Dashboard > SQL Editor).
--
-- WICHTIG: Vor Launch alle Testdaten löschen mit:
--   DELETE FROM messages; DELETE FROM conversation_participants;
--   DELETE FROM conversations; DELETE FROM rides;
--   DELETE FROM profiles WHERE email LIKE '%@test.carcashflow.de';
--   DELETE FROM auth.users WHERE email LIKE '%@test.carcashflow.de';
-- ============================================================

-- ============================================================
-- 1. TEST-USER ERSTELLEN
-- ============================================================
-- Hinweis: Supabase Auth erfordert User über auth.users.
-- Wir erstellen die User direkt in auth.users und der
-- Trigger handle_new_user() erstellt automatisch das Profil.
--
-- Falls der Trigger nicht aktiv ist, Profile manuell erstellen.
-- ============================================================

-- User 1: Max (München)
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role, encrypted_password, email_confirmed_at, confirmation_token)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'max@test.carcashflow.de',
  '{"first_name": "Max"}',
  now(), now(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  crypt('TestPass123!', gen_salt('bf')),
  now(), ''
) ON CONFLICT (id) DO NOTHING;

-- User 2: Lisa (Nürnberg)
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role, encrypted_password, email_confirmed_at, confirmation_token)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'lisa@test.carcashflow.de',
  '{"first_name": "Lisa"}',
  now(), now(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  crypt('TestPass123!', gen_salt('bf')),
  now(), ''
) ON CONFLICT (id) DO NOTHING;

-- User 3: Tom (Frankfurt)
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role, encrypted_password, email_confirmed_at, confirmation_token)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'tom@test.carcashflow.de',
  '{"first_name": "Tom"}',
  now(), now(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  crypt('TestPass123!', gen_salt('bf')),
  now(), ''
) ON CONFLICT (id) DO NOTHING;

-- User 4: Anna (Hamburg)
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role, encrypted_password, email_confirmed_at, confirmation_token)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'anna@test.carcashflow.de',
  '{"first_name": "Anna"}',
  now(), now(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  crypt('TestPass123!', gen_salt('bf')),
  now(), ''
) ON CONFLICT (id) DO NOTHING;

-- User 5: Jan (Köln)
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role, encrypted_password, email_confirmed_at, confirmation_token)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'jan@test.carcashflow.de',
  '{"first_name": "Jan"}',
  now(), now(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  crypt('TestPass123!', gen_salt('bf')),
  now(), ''
) ON CONFLICT (id) DO NOTHING;

-- User 6: Sophie (Stuttgart)
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role, encrypted_password, email_confirmed_at, confirmation_token)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  'sophie@test.carcashflow.de',
  '{"first_name": "Sophie"}',
  now(), now(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  crypt('TestPass123!', gen_salt('bf')),
  now(), ''
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 1b. PROFILE AKTUALISIEREN (falls Trigger aktiv war)
-- ============================================================
UPDATE profiles SET
  first_name = 'Max', username = 'max_test', city = 'München',
  subscription_tier = 'premium', subscription_status = 'active',
  trial_ends_at = now() + interval '90 days'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE profiles SET
  first_name = 'Lisa', username = 'lisa_test', city = 'Nürnberg',
  subscription_tier = 'premium', subscription_status = 'active',
  trial_ends_at = now() + interval '90 days'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE profiles SET
  first_name = 'Tom', username = 'tom_test', city = 'Frankfurt',
  subscription_tier = 'premium', subscription_status = 'active',
  trial_ends_at = now() + interval '90 days'
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE profiles SET
  first_name = 'Anna', username = 'anna_test', city = 'Hamburg',
  subscription_tier = 'premium', subscription_status = 'active',
  trial_ends_at = now() + interval '90 days'
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE profiles SET
  first_name = 'Jan', username = 'jan_test', city = 'Köln',
  subscription_tier = 'premium', subscription_status = 'active',
  trial_ends_at = now() + interval '90 days'
WHERE id = '55555555-5555-5555-5555-555555555555';

UPDATE profiles SET
  first_name = 'Sophie', username = 'sophie_test', city = 'Stuttgart',
  subscription_tier = 'premium', subscription_status = 'active',
  trial_ends_at = now() + interval '90 days'
WHERE id = '66666666-6666-6666-6666-666666666666';


-- ============================================================
-- 2. TEST-RIDES ERSTELLEN
-- ============================================================
-- Szenarien:
--   A) Exakt gleiche Route (München → Berlin)
--   B) Teilstrecke (Nürnberg → Leipzig auf München → Berlin)
--   C) Kleiner Umweg (2-5 km neben Autobahn)
--   D) Mittlerer Umweg (10-15 km)
--   E) Gegenrichtung (Berlin → München)
--   F) Komplett andere Route (Hamburg → Köln)
--   G) Suche (request) statt Angebot
-- ============================================================

-- Datumsbereich: nächste 7 Tage
-- (alle Rides nutzen CURRENT_DATE + offset damit sie immer aktuell sind)

-- ============================================================
-- ANGEBOTE (offers) - User bieten Fahrten an
-- ============================================================

-- A) Max bietet: München → Berlin (exakte Hauptroute)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'aaaa1111-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'offer',
  '[
    {"type": "start", "address": "München, Bayern", "lat": 48.1351, "lng": 11.5820, "order": 0},
    {"type": "end", "address": "Berlin, Deutschland", "lat": 52.5200, "lng": 13.4050, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 2,
  '08:00',
  3,
  'active',
  (CURRENT_DATE + 9)::timestamptz,
  false
);

-- B) Lisa bietet: Nürnberg → Leipzig (Teilstrecke von München → Berlin)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'aaaa1111-0000-0000-0000-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'offer',
  '[
    {"type": "start", "address": "Nürnberg, Bayern", "lat": 49.4521, "lng": 11.0767, "order": 0},
    {"type": "end", "address": "Leipzig, Sachsen", "lat": 51.3397, "lng": 12.3731, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 2,
  '09:00',
  2,
  'active',
  (CURRENT_DATE + 9)::timestamptz,
  false
);

-- C) Tom bietet: Frankfurt → Hannover (andere Achse, aber kreuzt evtl.)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'aaaa1111-0000-0000-0000-000000000003',
  '33333333-3333-3333-3333-333333333333',
  'offer',
  '[
    {"type": "start", "address": "Frankfurt am Main, Hessen", "lat": 50.1109, "lng": 8.6821, "order": 0},
    {"type": "end", "address": "Hannover, Niedersachsen", "lat": 52.3759, "lng": 9.7320, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 2,
  '07:30',
  4,
  'active',
  (CURRENT_DATE + 9)::timestamptz,
  false
);

-- D) Anna bietet: Hamburg → München (lange Route, Gegenrichtung zu manchen Suchen)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'aaaa1111-0000-0000-0000-000000000004',
  '44444444-4444-4444-4444-444444444444',
  'offer',
  '[
    {"type": "start", "address": "Hamburg, Deutschland", "lat": 53.5511, "lng": 9.9937, "order": 0},
    {"type": "end", "address": "München, Bayern", "lat": 48.1351, "lng": 11.5820, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 3,
  '06:00',
  3,
  'active',
  (CURRENT_DATE + 10)::timestamptz,
  false
);

-- E) Jan bietet: Köln → Berlin (westlichere Route)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'aaaa1111-0000-0000-0000-000000000005',
  '55555555-5555-5555-5555-555555555555',
  'offer',
  '[
    {"type": "start", "address": "Köln, Nordrhein-Westfalen", "lat": 50.9375, "lng": 6.9603, "order": 0},
    {"type": "end", "address": "Berlin, Deutschland", "lat": 52.5200, "lng": 13.4050, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 2,
  '08:30',
  2,
  'active',
  (CURRENT_DATE + 9)::timestamptz,
  false
);

-- F) Sophie bietet: Stuttgart → Nürnberg (kurze Strecke, Teil einer größeren Route)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'aaaa1111-0000-0000-0000-000000000006',
  '66666666-6666-6666-6666-666666666666',
  'offer',
  '[
    {"type": "start", "address": "Stuttgart, Baden-Württemberg", "lat": 48.7758, "lng": 9.1829, "order": 0},
    {"type": "end", "address": "Nürnberg, Bayern", "lat": 49.4521, "lng": 11.0767, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 1,
  '14:00',
  2,
  'active',
  (CURRENT_DATE + 8)::timestamptz,
  false
);

-- G) Max bietet auch: München → Nürnberg (kurze Strecke, morgen)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'aaaa1111-0000-0000-0000-000000000007',
  '11111111-1111-1111-1111-111111111111',
  'offer',
  '[
    {"type": "start", "address": "München, Bayern", "lat": 48.1351, "lng": 11.5820, "order": 0},
    {"type": "end", "address": "Nürnberg, Bayern", "lat": 49.4521, "lng": 11.0767, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 1,
  '16:00',
  4,
  'active',
  (CURRENT_DATE + 8)::timestamptz,
  false
);

-- H) Lisa bietet: Erlangen → Bamberg (sehr kurze Strecke, 2km neben A3)
-- Erlangen liegt direkt an der A3, ca. 2km Umweg von Autobahn
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'aaaa1111-0000-0000-0000-000000000008',
  '22222222-2222-2222-2222-222222222222',
  'offer',
  '[
    {"type": "start", "address": "Erlangen, Bayern", "lat": 49.5897, "lng": 11.0078, "order": 0},
    {"type": "end", "address": "Bamberg, Bayern", "lat": 49.8988, "lng": 10.9028, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 2,
  '10:00',
  2,
  'active',
  (CURRENT_DATE + 9)::timestamptz,
  false
);


-- ============================================================
-- GESUCHE (requests) - User suchen Mitfahrgelegenheiten
-- ============================================================

-- I) Tom sucht: Würzburg → Erfurt (liegt auf/nahe München → Berlin Route)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'bbbb2222-0000-0000-0000-000000000001',
  '33333333-3333-3333-3333-333333333333',
  'request',
  '[
    {"type": "start", "address": "Würzburg, Bayern", "lat": 49.7913, "lng": 9.9534, "order": 0},
    {"type": "end", "address": "Erfurt, Thüringen", "lat": 50.9787, "lng": 11.0328, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 2,
  '08:00',
  1,
  'active',
  (CURRENT_DATE + 9)::timestamptz,
  false
);

-- J) Anna sucht: Ingolstadt → Nürnberg (kurz, auf der A9 München → Berlin)
-- Ingolstadt: ca. 5km neben der A9
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'bbbb2222-0000-0000-0000-000000000002',
  '44444444-4444-4444-4444-444444444444',
  'request',
  '[
    {"type": "start", "address": "Ingolstadt, Bayern", "lat": 48.7665, "lng": 11.4258, "order": 0},
    {"type": "end", "address": "Nürnberg, Bayern", "lat": 49.4521, "lng": 11.0767, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 2,
  '09:00',
  1,
  'active',
  (CURRENT_DATE + 9)::timestamptz,
  false
);

-- K) Jan sucht: Düsseldorf → Dortmund (Kurzstrecke, Ruhrgebiet)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'bbbb2222-0000-0000-0000-000000000003',
  '55555555-5555-5555-5555-555555555555',
  'request',
  '[
    {"type": "start", "address": "Düsseldorf, Nordrhein-Westfalen", "lat": 51.2277, "lng": 6.7735, "order": 0},
    {"type": "end", "address": "Dortmund, Nordrhein-Westfalen", "lat": 51.5136, "lng": 7.4653, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 3,
  '07:00',
  1,
  'active',
  (CURRENT_DATE + 10)::timestamptz,
  false
);

-- L) Sophie sucht: München → Stuttgart (Gegenrichtung zu einigen Angeboten)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'bbbb2222-0000-0000-0000-000000000004',
  '66666666-6666-6666-6666-666666666666',
  'request',
  '[
    {"type": "start", "address": "München, Bayern", "lat": 48.1351, "lng": 11.5820, "order": 0},
    {"type": "end", "address": "Stuttgart, Baden-Württemberg", "lat": 48.7758, "lng": 9.1829, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 1,
  '15:00',
  1,
  'active',
  (CURRENT_DATE + 8)::timestamptz,
  false
);

-- M) Max sucht: Berlin → München (Rückfahrt, Gegenrichtung)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'bbbb2222-0000-0000-0000-000000000005',
  '11111111-1111-1111-1111-111111111111',
  'request',
  '[
    {"type": "start", "address": "Berlin, Deutschland", "lat": 52.5200, "lng": 13.4050, "order": 0},
    {"type": "end", "address": "München, Bayern", "lat": 48.1351, "lng": 11.5820, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 4,
  '10:00',
  1,
  'active',
  (CURRENT_DATE + 11)::timestamptz,
  false
);

-- N) Lisa sucht: Fürth → Bayreuth (kurze Strecke, nahe Nürnberg)
-- Fürth ist 6km neben Nürnberg
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'bbbb2222-0000-0000-0000-000000000006',
  '22222222-2222-2222-2222-222222222222',
  'request',
  '[
    {"type": "start", "address": "Fürth, Bayern", "lat": 49.4774, "lng": 10.9886, "order": 0},
    {"type": "end", "address": "Bayreuth, Bayern", "lat": 49.9427, "lng": 11.5761, "order": 1}
  ]'::jsonb,
  CURRENT_DATE + 2,
  '11:00',
  1,
  'active',
  (CURRENT_DATE + 9)::timestamptz,
  false
);


-- ============================================================
-- VERIFIZIERUNG
-- ============================================================
-- Prüfe ob alles korrekt eingefügt wurde:

-- SELECT 'profiles' as tbl, count(*) FROM profiles WHERE email LIKE '%@test.carcashflow.de'
-- UNION ALL
-- SELECT 'rides_offer', count(*) FROM rides WHERE user_id IN (
--   SELECT id FROM profiles WHERE email LIKE '%@test.carcashflow.de'
-- ) AND type = 'offer'
-- UNION ALL
-- SELECT 'rides_request', count(*) FROM rides WHERE user_id IN (
--   SELECT id FROM profiles WHERE email LIKE '%@test.carcashflow.de'
-- ) AND type = 'request';

-- Erwartetes Ergebnis:
-- profiles: 6
-- rides_offer: 8
-- rides_request: 6


-- ============================================================
-- CLEANUP (vor Launch ausführen!)
-- ============================================================
-- DELETE FROM messages WHERE conversation_id IN (
--   SELECT c.id FROM conversations c
--   JOIN rides r ON c.ride_id = r.id
--   WHERE r.user_id IN (SELECT id FROM profiles WHERE email LIKE '%@test.carcashflow.de')
-- );
-- DELETE FROM conversation_participants WHERE user_id IN (
--   SELECT id FROM profiles WHERE email LIKE '%@test.carcashflow.de'
-- );
-- DELETE FROM conversations WHERE ride_id IN (
--   SELECT id FROM rides WHERE user_id IN (
--     SELECT id FROM profiles WHERE email LIKE '%@test.carcashflow.de'
--   )
-- );
-- DELETE FROM notifications WHERE user_id IN (
--   SELECT id FROM profiles WHERE email LIKE '%@test.carcashflow.de'
-- );
-- DELETE FROM rides WHERE user_id IN (
--   SELECT id FROM profiles WHERE email LIKE '%@test.carcashflow.de'
-- );
-- DELETE FROM profiles WHERE email LIKE '%@test.carcashflow.de';
-- DELETE FROM auth.users WHERE email LIKE '%@test.carcashflow.de';
