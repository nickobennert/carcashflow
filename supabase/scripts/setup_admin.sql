-- =====================================================
-- ADMIN-USER EINRICHTEN
-- =====================================================
--
-- Ersetze 'DEINE-USER-ID' mit der UUID des Users,
-- der Admin-Rechte bekommen soll.
--
-- Die User-ID findest du:
-- 1. In Supabase Dashboard > Authentication > Users
-- 2. Oder in der profiles Tabelle
--
-- =====================================================

-- Variante 1: Admin per User-ID hinzufügen
-- INSERT INTO super_admins (user_id, role)
-- VALUES ('DEINE-USER-ID-HIER', 'super_admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Variante 2: Admin per Email hinzufügen
-- INSERT INTO super_admins (user_id, role)
-- SELECT id, 'super_admin'
-- FROM profiles
-- WHERE email = 'admin@example.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- =====================================================
-- ADMIN ENTFERNEN
-- =====================================================

-- DELETE FROM super_admins WHERE user_id = 'USER-ID-HIER';

-- =====================================================
-- ALLE ADMINS ANZEIGEN
-- =====================================================

SELECT
    sa.id,
    sa.user_id,
    sa.role,
    p.email,
    p.username,
    p.first_name,
    p.last_name,
    sa.created_at
FROM super_admins sa
LEFT JOIN profiles p ON sa.user_id = p.id
ORDER BY sa.created_at;
