-- ============================================================
-- CARCASHFLOW TEST DATA - FEBRUAR 2026
-- ============================================================
-- Dieses Script erstellt frische Testdaten für Februar 2026.
-- Ausführen in Supabase SQL Editor (Dashboard > SQL Editor).
--
-- VORAUSSETZUNG: Die 6 Test-User aus test-data.sql müssen existieren!
-- Falls nicht, zuerst test-data.sql ausführen (User-Teil).
--
-- CLEANUP: Alte Rides der Test-User zuerst löschen:
-- ============================================================

-- ============================================================
-- 0. ALTE TEST-RIDES BEREINIGEN
-- ============================================================
DELETE FROM rides WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
);

-- ============================================================
-- 1. ANGEBOTE (offers) - Februar 2026
-- ============================================================

-- A) Jan bietet: Köln → Berlin (DEMO-SZENARIO für "Düsseldorf → Potsdam" Matching)
-- Düsseldorf ist ~40km von Köln, Potsdam ~30km von Berlin
-- → "Same Direction" Matching sollte das finden!
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00001-0000-0000-0000-000000000001',
  '55555555-5555-5555-5555-555555555555',
  'offer',
  '[
    {"type": "start", "address": "Köln, Nordrhein-Westfalen", "lat": 50.9375, "lng": 6.9603, "order": 0},
    {"type": "end", "address": "Berlin, Deutschland", "lat": 52.5200, "lng": 13.4050, "order": 1}
  ]'::jsonb,
  '2026-02-05',
  '08:30',
  2,
  'active',
  '2026-02-12'::timestamptz,
  false
);

-- B) Max bietet: München → Berlin (Hauptachse Süd→Nord)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00001-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'offer',
  '[
    {"type": "start", "address": "München, Bayern", "lat": 48.1351, "lng": 11.5820, "order": 0},
    {"type": "end", "address": "Berlin, Deutschland", "lat": 52.5200, "lng": 13.4050, "order": 1}
  ]'::jsonb,
  '2026-02-06',
  '07:00',
  3,
  'active',
  '2026-02-13'::timestamptz,
  false
);

-- C) Tom bietet: Frankfurt → Hannover (West-Achse)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00001-0000-0000-0000-000000000003',
  '33333333-3333-3333-3333-333333333333',
  'offer',
  '[
    {"type": "start", "address": "Frankfurt am Main, Hessen", "lat": 50.1109, "lng": 8.6821, "order": 0},
    {"type": "end", "address": "Hannover, Niedersachsen", "lat": 52.3759, "lng": 9.7320, "order": 1}
  ]'::jsonb,
  '2026-02-05',
  '09:00',
  4,
  'active',
  '2026-02-12'::timestamptz,
  false
);

-- D) Lisa bietet: Nürnberg → Leipzig (Teilstrecke München→Berlin)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00001-0000-0000-0000-000000000004',
  '22222222-2222-2222-2222-222222222222',
  'offer',
  '[
    {"type": "start", "address": "Nürnberg, Bayern", "lat": 49.4521, "lng": 11.0767, "order": 0},
    {"type": "end", "address": "Leipzig, Sachsen", "lat": 51.3397, "lng": 12.3731, "order": 1}
  ]'::jsonb,
  '2026-02-06',
  '08:00',
  2,
  'active',
  '2026-02-13'::timestamptz,
  false
);

-- E) Sophie bietet: Stuttgart → Nürnberg (kurze Süd-Strecke)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00001-0000-0000-0000-000000000005',
  '66666666-6666-6666-6666-666666666666',
  'offer',
  '[
    {"type": "start", "address": "Stuttgart, Baden-Württemberg", "lat": 48.7758, "lng": 9.1829, "order": 0},
    {"type": "end", "address": "Nürnberg, Bayern", "lat": 49.4521, "lng": 11.0767, "order": 1}
  ]'::jsonb,
  '2026-02-04',
  '14:00',
  2,
  'active',
  '2026-02-11'::timestamptz,
  false
);

-- F) Anna bietet: Hamburg → München (Lange Nord→Süd Achse)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00001-0000-0000-0000-000000000006',
  '44444444-4444-4444-4444-444444444444',
  'offer',
  '[
    {"type": "start", "address": "Hamburg, Deutschland", "lat": 53.5511, "lng": 9.9937, "order": 0},
    {"type": "end", "address": "München, Bayern", "lat": 48.1351, "lng": 11.5820, "order": 1}
  ]'::jsonb,
  '2026-02-07',
  '06:00',
  3,
  'active',
  '2026-02-14'::timestamptz,
  false
);

-- G) Jan bietet auch: Düsseldorf → Hamburg (Parallele zum Köln→Berlin, nördlicher)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00001-0000-0000-0000-000000000007',
  '55555555-5555-5555-5555-555555555555',
  'offer',
  '[
    {"type": "start", "address": "Düsseldorf, Nordrhein-Westfalen", "lat": 51.2277, "lng": 6.7735, "order": 0},
    {"type": "end", "address": "Hamburg, Deutschland", "lat": 53.5511, "lng": 9.9937, "order": 1}
  ]'::jsonb,
  '2026-02-08',
  '10:00',
  2,
  'active',
  '2026-02-15'::timestamptz,
  false
);

-- H) Max bietet: München → Nürnberg (kurze Strecke)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00001-0000-0000-0000-000000000008',
  '11111111-1111-1111-1111-111111111111',
  'offer',
  '[
    {"type": "start", "address": "München, Bayern", "lat": 48.1351, "lng": 11.5820, "order": 0},
    {"type": "end", "address": "Nürnberg, Bayern", "lat": 49.4521, "lng": 11.0767, "order": 1}
  ]'::jsonb,
  '2026-02-04',
  '16:00',
  4,
  'active',
  '2026-02-11'::timestamptz,
  false
);

-- I) Lisa bietet: Erlangen → Bamberg (Kurzstrecke Franken)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00001-0000-0000-0000-000000000009',
  '22222222-2222-2222-2222-222222222222',
  'offer',
  '[
    {"type": "start", "address": "Erlangen, Bayern", "lat": 49.5897, "lng": 11.0078, "order": 0},
    {"type": "end", "address": "Bamberg, Bayern", "lat": 49.8988, "lng": 10.9028, "order": 1}
  ]'::jsonb,
  '2026-02-05',
  '10:00',
  2,
  'active',
  '2026-02-12'::timestamptz,
  false
);

-- ============================================================
-- 2. GESUCHE (requests) - Februar 2026
-- ============================================================

-- J) Tom sucht: Düsseldorf → Potsdam (DEMO: soll Köln→Berlin finden!)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00002-0000-0000-0000-000000000001',
  '33333333-3333-3333-3333-333333333333',
  'request',
  '[
    {"type": "start", "address": "Düsseldorf, Nordrhein-Westfalen", "lat": 51.2277, "lng": 6.7735, "order": 0},
    {"type": "end", "address": "Potsdam, Brandenburg", "lat": 52.3906, "lng": 13.0645, "order": 1}
  ]'::jsonb,
  '2026-02-05',
  '08:00',
  1,
  'active',
  '2026-02-12'::timestamptz,
  false
);

-- K) Anna sucht: Ingolstadt → Nürnberg (liegt auf der A9)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00002-0000-0000-0000-000000000002',
  '44444444-4444-4444-4444-444444444444',
  'request',
  '[
    {"type": "start", "address": "Ingolstadt, Bayern", "lat": 48.7665, "lng": 11.4258, "order": 0},
    {"type": "end", "address": "Nürnberg, Bayern", "lat": 49.4521, "lng": 11.0767, "order": 1}
  ]'::jsonb,
  '2026-02-06',
  '09:00',
  1,
  'active',
  '2026-02-13'::timestamptz,
  false
);

-- L) Jan sucht: Düsseldorf → Dortmund (Kurzstrecke NRW)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00002-0000-0000-0000-000000000003',
  '55555555-5555-5555-5555-555555555555',
  'request',
  '[
    {"type": "start", "address": "Düsseldorf, Nordrhein-Westfalen", "lat": 51.2277, "lng": 6.7735, "order": 0},
    {"type": "end", "address": "Dortmund, Nordrhein-Westfalen", "lat": 51.5136, "lng": 7.4653, "order": 1}
  ]'::jsonb,
  '2026-02-07',
  '07:00',
  1,
  'active',
  '2026-02-14'::timestamptz,
  false
);

-- M) Sophie sucht: München → Stuttgart (Gegenrichtung)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00002-0000-0000-0000-000000000004',
  '66666666-6666-6666-6666-666666666666',
  'request',
  '[
    {"type": "start", "address": "München, Bayern", "lat": 48.1351, "lng": 11.5820, "order": 0},
    {"type": "end", "address": "Stuttgart, Baden-Württemberg", "lat": 48.7758, "lng": 9.1829, "order": 1}
  ]'::jsonb,
  '2026-02-04',
  '15:00',
  1,
  'active',
  '2026-02-11'::timestamptz,
  false
);

-- N) Max sucht: Berlin → München (Rückfahrt)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00002-0000-0000-0000-000000000005',
  '11111111-1111-1111-1111-111111111111',
  'request',
  '[
    {"type": "start", "address": "Berlin, Deutschland", "lat": 52.5200, "lng": 13.4050, "order": 0},
    {"type": "end", "address": "München, Bayern", "lat": 48.1351, "lng": 11.5820, "order": 1}
  ]'::jsonb,
  '2026-02-09',
  '10:00',
  1,
  'active',
  '2026-02-16'::timestamptz,
  false
);

-- O) Lisa sucht: Fürth → Bayreuth (Kurzstrecke Franken)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00002-0000-0000-0000-000000000006',
  '22222222-2222-2222-2222-222222222222',
  'request',
  '[
    {"type": "start", "address": "Fürth, Bayern", "lat": 49.4774, "lng": 10.9886, "order": 0},
    {"type": "end", "address": "Bayreuth, Bayern", "lat": 49.9427, "lng": 11.5761, "order": 1}
  ]'::jsonb,
  '2026-02-05',
  '11:00',
  1,
  'active',
  '2026-02-12'::timestamptz,
  false
);

-- P) Anna sucht: Essen → Berlin (Parallele zu Köln→Berlin, nördlicher Start)
INSERT INTO rides (id, user_id, type, route, departure_date, departure_time, seats_available, status, expires_at, is_recurring)
VALUES (
  'feb00002-0000-0000-0000-000000000007',
  '44444444-4444-4444-4444-444444444444',
  'request',
  '[
    {"type": "start", "address": "Essen, Nordrhein-Westfalen", "lat": 51.4556, "lng": 7.0116, "order": 0},
    {"type": "end", "address": "Berlin, Deutschland", "lat": 52.5200, "lng": 13.4050, "order": 1}
  ]'::jsonb,
  '2026-02-05',
  '07:30',
  1,
  'active',
  '2026-02-12'::timestamptz,
  false
);


-- ============================================================
-- VERIFIZIERUNG
-- ============================================================
SELECT 'offers' as typ, count(*) as anzahl FROM rides
  WHERE user_id IN ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555','66666666-6666-6666-6666-666666666666')
  AND type = 'offer'
UNION ALL
SELECT 'requests', count(*) FROM rides
  WHERE user_id IN ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555','66666666-6666-6666-6666-666666666666')
  AND type = 'request';

-- Erwartetes Ergebnis:
-- offers: 9
-- requests: 7


-- ============================================================
-- DEMO-SZENARIO: Düsseldorf → Potsdam findet Köln → Berlin
-- ============================================================
-- 1. Öffne die App als beliebiger User (NICHT als Jan, da Jan der Anbieter ist)
-- 2. Gehe zu "Unterwegs" → "Strecke"
-- 3. Gib ein: Von "Düsseldorf" Nach "Potsdam"
-- 4. Ergebnis: Jan's "Köln → Berlin" Angebot sollte erscheinen
--    → Match über "Same Direction" Algorithmus
--    → Köln ist ~40km von Düsseldorf, Berlin ~30km von Potsdam
--    → Gleiche Fahrtrichtung (West → Ost)


-- ============================================================
-- CLEANUP (diesen Block ausführen um NUR die Feb-Daten zu löschen)
-- ============================================================
-- DELETE FROM rides WHERE id LIKE 'feb0000%';
--
-- ODER: Alle Test-User Rides komplett löschen:
-- DELETE FROM rides WHERE user_id IN (
--   '11111111-1111-1111-1111-111111111111',
--   '22222222-2222-2222-2222-222222222222',
--   '33333333-3333-3333-3333-333333333333',
--   '44444444-4444-4444-4444-444444444444',
--   '55555555-5555-5555-5555-555555555555',
--   '66666666-6666-6666-6666-666666666666'
-- );
