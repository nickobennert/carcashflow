# Push-Benachrichtigungen Setup

## 1. Environment Variables

Füge diese Variablen zu deiner `.env.local` und Vercel hinzu:

```env
# Web Push VAPID Keys (generiert mit: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLUYP2yqfuhd4I4o_DKpyOIuySnd8j5Fk7_3BSoAvRHjJqUTmxdSFwTZiE8ud-fpCDJwHBOPQJajXUP2gN6TMXc
VAPID_PRIVATE_KEY=gj-N89VMIaL1tZeA9QdFNspB-FlF8gMzHdX1ncJbpGM
VAPID_SUBJECT=mailto:support@fahr-mit.de
```

**Wichtig:**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Öffentlich, wird im Browser verwendet
- `VAPID_PRIVATE_KEY` - Geheim! Nur auf dem Server
- `VAPID_SUBJECT` - Kontakt-Email für Push-Service-Betreiber

## 2. Supabase SQL Migration

Führe dieses SQL in der Supabase Console aus:

```sql
-- Push Subscriptions Table
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint per endpoint (user can have multiple devices)
  UNIQUE(user_id, endpoint)
);

-- Index for fast lookup by user
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Add push_enabled to profiles for quick toggle
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT false;
```

## 3. PWA Icons erstellen

Erstelle diese Icons in `/public`:
- `icon-192.png` (192x192) - App Icon
- `icon-512.png` (512x512) - App Icon groß
- `icon-badge.png` (96x96) - Notification Badge

## 4. Funktionsweise

### Subscription Flow
1. User klickt "Benachrichtigungen aktivieren"
2. Browser fragt nach Permission
3. Bei Erlaubnis: Browser gibt uns einen Subscription-Endpoint
4. Wir speichern den Endpoint in `push_subscriptions`
5. User kann auf mehreren Geräten Subscriptions haben

### Push senden
1. Neue Nachricht wird erstellt
2. Server holt alle Subscriptions des Empfängers
3. Server sendet Push an jeden Endpoint
4. Browser empfängt Push via Service Worker
5. Service Worker zeigt Notification

### Fehlerbehandlung
- Ungültige Endpoints (User hat Erlaubnis widerrufen) werden automatisch gelöscht
- Push-Fehler werden geloggt aber nicht an User weitergegeben
