# Fahr mit! - Technische Dokumentation

> **Letzte Aktualisierung:** Februar 2025
> **Version:** MVP 1.0
> **Autor:** Entwicklungsteam

---

## Inhaltsverzeichnis

1. [Projektübersicht](#1-projektübersicht)
2. [Tech Stack](#2-tech-stack)
3. [Projektstruktur](#3-projektstruktur)
4. [Datenbank-Schema](#4-datenbank-schema)
5. [Authentifizierung](#5-authentifizierung)
6. [Nachrichtensystem](#6-nachrichtensystem)
7. [Fahrten-System (Rides)](#7-fahrten-system-rides)
8. [Push Notifications](#8-push-notifications)
9. [Bug Reports](#9-bug-reports)
10. [Admin-Panel](#10-admin-panel)
11. [Sicherheit](#11-sicherheit)
12. [Environment Variables](#12-environment-variables)
13. [Deployment](#13-deployment)
14. [Bekannte Einschränkungen](#14-bekannte-einschränkungen)
15. [SQL-Referenz](#15-sql-referenz)

---

## 1. Projektübersicht

### Was ist Fahr mit!?

**Fahr mit!** ist eine Mitfahrbörse für Schulungsteilnehmer. Die Plattform dient ausschließlich der **Kontaktanbahnung** - es findet keine Vermittlung, Prüfung oder Haftung durch den Betreiber statt.

### Kernfunktionen

| Funktion | Beschreibung |
|----------|--------------|
| **Mitfahrbörse** | User können Fahrten anbieten oder suchen |
| **Nachrichten** | Internes Messaging-System zur Kontaktaufnahme |
| **Route-Matching** | Automatische Benachrichtigung bei passenden Fahrten |
| **Profil-System** | Öffentliche/private Nutzerprofile |
| **Bug Reports** | Integriertes Fehlermeldesystem |

### Wichtiger Hinweis

Die App zeigt permanent folgenden Hinweis:
> "Diese Funktion dient ausschließlich der Kontaktanbahnung. Es findet keine Vermittlung oder Haftung statt. Absprachen erfolgen eigenverantwortlich zwischen den Nutzern."

---

## 2. Tech Stack

### Frontend

| Technologie | Version | Verwendung |
|-------------|---------|------------|
| Next.js | 15+ | App Router Framework |
| React | 19 | UI Library |
| TypeScript | Strict | Typisierung |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | Latest | UI-Komponenten (Radix-basiert) |
| Motion | Latest | Animationen |
| Lucide React | Latest | Icons |
| next-themes | Latest | Dark/Light Mode |
| nuqs | Latest | URL State Management |
| date-fns | Latest | Datums-Formatierung |
| sonner | Latest | Toast Notifications |

### Backend & Services

| Service | Verwendung |
|---------|------------|
| **Supabase** | PostgreSQL, Auth, Storage, Realtime |
| **Vercel** | Hosting & Deployment |
| **GitHub** | Version Control |
| **OSRM** | Route-Berechnung (öffentliche API) |

### Externe APIs

| API | Endpunkt | Verwendung |
|-----|----------|------------|
| Photon/Komoot | `photon.komoot.io` | Geocoding/Adresssuche |
| OSRM | `router.project-osrm.org` | Routen-Berechnung |

---

## 3. Projektstruktur

```
src/
├── app/
│   ├── (authenticated)/      # Geschützte Seiten (Login erforderlich)
│   │   ├── dashboard/        # Mitfahrbörse Hauptansicht
│   │   ├── messages/         # Nachrichtensystem
│   │   │   └── [id]/         # Einzelne Konversation
│   │   ├── profile/          # Profil bearbeiten
│   │   ├── settings/         # Account-Einstellungen
│   │   ├── help/             # Hilfe & Bug-Report
│   │   └── changelog/        # App-Updates
│   │
│   ├── admin/                # Admin-Panel (SuperAdmin only)
│   │
│   ├── api/                  # API-Routen
│   │   ├── rides/            # Fahrten CRUD + Matching
│   │   ├── messages/         # Nachrichten
│   │   ├── conversations/    # Konversationen
│   │   ├── notifications/    # In-App Notifications
│   │   ├── push/             # Web Push
│   │   ├── bug-report/       # Bug-Meldungen
│   │   ├── settings/         # Profil & Account
│   │   └── admin/            # Admin-Funktionen
│   │
│   ├── auth/
│   │   ├── callback/         # OAuth Callback
│   │   └── redirect/         # Post-Auth Handler
│   │
│   ├── login/
│   ├── signup/
│   └── u/[username]/         # Öffentliche Profilseite
│
├── components/
│   ├── ui/                   # shadcn/ui Komponenten
│   ├── layout/               # App Shell, Sidebar, Header
│   ├── rides/                # Ride Cards, Forms, Filters
│   ├── messages/             # Chat Components
│   ├── notifications/        # Notification Dropdown
│   └── help/                 # Bug Report Modal
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser Client
│   │   ├── server.ts         # Server Client
│   │   └── admin.ts          # Service Role Client
│   ├── push/
│   │   └── server.ts         # Web Push Server
│   ├── animations.ts         # Motion Variants
│   └── utils.ts              # Hilfsfunktionen
│
├── hooks/
│   ├── use-notification-sound.ts
│   ├── use-unread-messages.ts
│   └── ...
│
├── types/
│   └── database.ts           # TypeScript Types für DB
│
└── middleware.ts             # Auth Protection
```

---

## 4. Datenbank-Schema

### Haupttabellen

#### `profiles`
Erweitert `auth.users` mit zusätzlichen Profilinformationen.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  training_location TEXT,
  training_date DATE,
  theme_preference TEXT DEFAULT 'system',
  notification_preferences JSONB,
  push_enabled BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);
```

#### `rides`
Mitfahrangebote und -gesuche.

```sql
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                    -- 'offer' oder 'request'
  route JSONB NOT NULL,                  -- Array von RoutePoints
  departure_date DATE NOT NULL,
  departure_time TIME,
  seats_available INTEGER DEFAULT 1,
  comment TEXT,
  status TEXT DEFAULT 'active',          -- 'active', 'completed', 'cancelled', 'expired'
  is_recurring BOOLEAN DEFAULT false,
  recurring_days INTEGER[],
  recurring_until DATE,
  parent_ride_id UUID,
  route_geometry JSONB,                  -- OSRM Polyline
  route_distance INTEGER,                -- Meter
  route_duration INTEGER,                -- Sekunden
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
```

**RoutePoint-Struktur:**
```typescript
interface RoutePoint {
  type: "start" | "stop" | "end"
  address: string
  lat?: number
  lng?: number
  order: number
}
```

#### `conversations`
Chat-Konversationen zwischen zwei Usern.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES profiles(id),
  participant_2 UUID NOT NULL REFERENCES profiles(id),
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Normalisierte Reihenfolge (kleinere UUID zuerst)
  UNIQUE(participant_1, participant_2)
);
```

#### `messages`
Einzelne Nachrichten in Konversationen.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT false,    -- Legacy, nicht mehr verwendet
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `hidden_conversations`
Versteckte Chats pro User (Soft-Delete).

```sql
CREATE TABLE hidden_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, conversation_id)
);
```

**Verhalten:**
- Wenn User A einen Chat "löscht", wird nur ein Eintrag in `hidden_conversations` erstellt
- Der Chat ist für User A nicht mehr sichtbar
- User B sieht den Chat weiterhin
- Wenn User B eine neue Nachricht sendet, wird der `hidden_conversations`-Eintrag für User A gelöscht
- Wenn **beide** User den Chat löschen, wird alles permanent gelöscht

#### `notifications`
In-App Benachrichtigungen.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                    -- 'new_message', 'ride_match', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,                            -- z.B. { ride_id, conversation_id }
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `push_subscriptions`
Web Push Subscriptions.

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `bug_reports`
Bug-Meldungen von Usern.

```sql
CREATE TABLE bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  area TEXT NOT NULL,                    -- 'dashboard', 'messages', 'profile', etc.
  description TEXT NOT NULL,
  worked_before TEXT,
  expected_behavior TEXT,
  screencast_url TEXT,
  screenshots TEXT[],                    -- Array von Supabase Storage URLs
  status TEXT DEFAULT 'open',            -- 'open', 'in_progress', 'resolved', 'wont_fix'
  admin_notes TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
);
```

#### `super_admins`
Admin-Berechtigungen.

```sql
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',             -- 'super_admin', 'admin', 'moderator'
  permissions JSONB DEFAULT '{}',
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `route_watches`
Gespeicherte Routen für automatische Benachrichtigungen.

```sql
CREATE TABLE route_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                    -- 'location' oder 'route'
  -- Location-based
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  radius INTEGER,                        -- km
  address TEXT,
  -- Route-based
  start_lat DECIMAL(10, 8),
  start_lng DECIMAL(11, 8),
  start_address TEXT,
  end_lat DECIMAL(10, 8),
  end_lng DECIMAL(11, 8),
  end_address TEXT,
  -- Preferences
  ride_type TEXT DEFAULT 'both',         -- 'offer', 'request', 'both'
  created_at TIMESTAMPTZ DEFAULT now(),
  last_notified_at TIMESTAMPTZ
);
```

---

## 5. Authentifizierung

### Flow

```
SignUp → Email Bestätigung → Login → Profile Setup → Dashboard
```

### Supabase Auth

Die App verwendet Supabase Auth mit Email/Password.

**Wichtig:** Google OAuth ist implementiert aber derzeit deaktiviert (auskommentiert in `login-form.tsx` und `signup-form.tsx`).

### Middleware Protection

```typescript
// middleware.ts
const protectedRoutes = ['/dashboard', '/messages', '/profile', '/settings']
```

Alle Routen unter `(authenticated)` erfordern einen eingeloggten User.

### Profile-Erstellung

Bei der Registrierung wird automatisch ein Profil erstellt:

```sql
CREATE FUNCTION handle_new_user()
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
```

---

## 6. Nachrichtensystem

### Architektur

```
User A                    Server                    User B
   |                        |                         |
   |-- Nachricht senden --> |                         |
   |                        |-- DB Insert ----------> |
   |                        |-- Realtime Event -----> |
   |                        |-- Push Notification --> |
   |                        |-- In-App Notification ->|
   |                        |                         |
```

### Nachrichten senden

**Endpoint:** `POST /api/messages`

```typescript
// Request
{
  conversation_id: string,
  content: string
}

// Response
{
  data: MessageWithSender
}
```

### Realtime Updates

Die App verwendet Supabase Realtime für:

1. **Neue Nachrichten** - `postgres_changes` auf `messages` Tabelle
2. **Typing Indicator** - Broadcast Channel
3. **Online Status** - Presence Channel

```typescript
// conversation-view.tsx
const messageChannel = supabase
  .channel(`conversation:${conversationId}`)
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "messages",
    filter: `conversation_id=eq.${conversationId}`,
  }, handleNewMessage)
  .subscribe()
```

### Chat ausblenden

Wenn ein User einen Chat "löscht":

1. Eintrag in `hidden_conversations` wird erstellt
2. Chat wird für diesen User nicht mehr angezeigt
3. Wenn der andere User auch löscht → permanente Löschung
4. Wenn eine neue Nachricht kommt → Chat wird wieder sichtbar

### Sicherheit (Keine E2E-Verschlüsselung)

**Wichtig:** E2E-Verschlüsselung wurde deaktiviert (Februar 2025).

**Warum?**
- Web-Apps können Schlüssel nicht zuverlässig persistent speichern
- Browser können IndexedDB jederzeit löschen
- Kein geräteübergreifender Schlüsselaustausch

**Aktuelle Sicherheit:**
- ✅ TLS/HTTPS für alle Verbindungen (in transit)
- ✅ Supabase verschlüsselt Daten at rest
- ✅ Row Level Security (RLS) beschränkt Zugriff
- ✅ User können nur ihre eigenen Konversationen sehen

Das ist das gleiche Sicherheitsniveau wie Slack, Discord oder andere Web-Messaging-Apps.

---

## 7. Fahrten-System (Rides)

### Fahrten-Typen

| Typ | Bedeutung |
|-----|-----------|
| `offer` | User bietet Mitfahrgelegenheit an |
| `request` | User sucht Mitfahrgelegenheit |

### CRUD Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/rides` | Alle aktiven Fahrten |
| POST | `/api/rides` | Neue Fahrt erstellen |
| GET | `/api/rides/[id]` | Einzelne Fahrt |
| PATCH | `/api/rides/[id]` | Fahrt aktualisieren |
| DELETE | `/api/rides/[id]` | Fahrt löschen |

### Route-Matching

**Endpoint:** `POST /api/rides/match`

```typescript
// Request
{
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  type?: "offer" | "request" | "both"
}

// Response
{
  data: RideWithMatchData[]
}
```

**Matching-Algorithmus:**
1. Berechne Entfernung von Start zu allen Ride-Starts
2. Berechne Entfernung von Ende zu allen Ride-Enden
3. Filter: Max 30km Abweichung
4. Sortiere nach Gesamtabweichung

### Wiederkehrende Fahrten

User können Fahrten als "wiederkehrend" markieren:

```typescript
{
  is_recurring: true,
  recurring_days: [1, 3, 5],  // Mo, Mi, Fr (0 = Sonntag)
  recurring_until: "2025-06-30"
}
```

### Auto-Expire

Fahrten laufen automatisch nach 7 Tagen ab (gesteuert durch `expires_at`).

---

## 8. Push Notifications

### Setup

Push Notifications verwenden das Web Push Protocol mit VAPID Keys.

**Generiere VAPID Keys:**
```bash
npx web-push generate-vapid-keys
```

**Environment Variables:**
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

### Flow

```
1. User aktiviert Push in Einstellungen
2. Browser fragt um Erlaubnis
3. Service Worker registriert Subscription
4. Subscription wird in DB gespeichert
5. Bei neuer Nachricht → Push wird gesendet
```

### Endpoints

| Endpoint | Beschreibung |
|----------|--------------|
| `POST /api/push/subscribe` | Subscription registrieren |
| `DELETE /api/push/subscribe` | Subscription entfernen |
| `POST /api/push/test` | Test-Push senden (Debug) |

### Service Worker

Datei: `public/sw.js`

```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json()
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-badge.png',
    tag: data.tag,
    data: data.data
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  clients.openWindow(url)
})
```

---

## 9. Bug Reports

### User-Flow

1. User öffnet Hilfe-Seite (`/help`)
2. Klickt auf "Fehler melden"
3. Füllt Formular aus (Titel, Bereich, Beschreibung)
4. Optional: Screenshots hochladen
5. Bug wird in DB gespeichert

### Admin-Flow

1. Admin öffnet Admin-Panel → Bug Reports
2. Sieht alle gemeldeten Bugs
3. Kann Status ändern: `open` → `in_progress` → `resolved` / `wont_fix`
4. Kann Admin-Notizen hinzufügen
5. Kann Bug löschen (inkl. Screenshots aus Storage)

### Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/api/bug-report` | Bug melden (User) |
| GET | `/api/bug-report` | Alle Bugs (Admin) |
| GET | `/api/bug-report/[id]` | Einzelner Bug (Admin) |
| PATCH | `/api/bug-report/[id]` | Status ändern (Admin) |
| DELETE | `/api/bug-report/[id]` | Bug löschen (Admin) |

### Screenshot-Speicherung

Screenshots werden in Supabase Storage gespeichert:
- Bucket: `uploads`
- Pfad: `bug-reports/{user_id}/{timestamp}_{index}_{filename}`

---

## 10. Admin-Panel

### Zugang

Nur User in der `super_admins` Tabelle haben Zugriff auf `/admin`.

### Funktionen

| Bereich | Funktionen |
|---------|------------|
| **Dashboard** | Statistiken (User, Rides, Messages) |
| **Users** | User-Liste, Suche, Sperren |
| **Rides** | Alle Fahrten verwalten |
| **Bug Reports** | Gemeldete Fehler bearbeiten |
| **Settings** | App-Einstellungen |

### Admin hinzufügen (SQL)

```sql
INSERT INTO super_admins (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

---

## 11. Sicherheit

### Row Level Security (RLS)

Alle Tabellen haben RLS aktiviert. Beispiel für `messages`:

```sql
-- Users können nur Nachrichten in ihren Konversationen sehen
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
  )
);

-- Users können nur in ihren Konversationen schreiben
CREATE POLICY "Users can insert messages in their conversations"
ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
  )
);
```

### Admin Client

Für Server-seitige Operationen, die RLS umgehen müssen, gibt es den Admin Client:

```typescript
// lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // ACHTUNG: Nie im Client verwenden!
  )
}
```

**Verwendung:** Nur in API-Routes, nie im Client-Code!

### Datenschutz

- Telefonnummern sind privat (nicht öffentlich sichtbar)
- User können Profil-Sichtbarkeit steuern
- DSGVO-konformer Datenexport unter Einstellungen
- Account-Löschung löscht alle Daten

---

## 12. Environment Variables

### Erforderlich

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN...
VAPID_PRIVATE_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=https://fahrmit.de
```

### Optional

```env
# Stripe (falls Subscription aktiviert)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Vercel Setup

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Alle Variablen für Production und Preview hinzufügen
3. `SUPABASE_SERVICE_ROLE_KEY` NUR für Server (nicht `NEXT_PUBLIC_`)

---

## 13. Deployment

### Vercel Deployment

```bash
# Erste Installation
vercel

# Deployment
vercel --prod
```

### GitHub Integration

1. Repository mit Vercel verbinden
2. Auto-Deploy bei Push auf `main`
3. Preview Deployments für Pull Requests

### Build-Kommandos

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Supabase Migrations

Datenbankänderungen sollten als SQL-Migrations dokumentiert werden:

```bash
# Migrations-Ordner
migrations/
├── 001_initial_schema.sql
├── 002_add_push_subscriptions.sql
├── 003_add_bug_reports.sql
└── 004_add_hidden_conversations.sql
```

---

## 14. Bekannte Einschränkungen

### E2E-Verschlüsselung deaktiviert

**Status:** Deaktiviert (Februar 2025)

**Grund:** Web-Apps können Krypto-Schlüssel nicht zuverlässig speichern. IndexedDB kann vom Browser jederzeit gelöscht werden.

**Auswirkung:**
- Alte verschlüsselte Nachrichten zeigen "[Nachricht konnte nicht entschlüsselt werden]"
- Neue Nachrichten werden als Klartext gespeichert

**Sicherheit:** TLS + Supabase Encryption + RLS bieten weiterhin guten Schutz.

### Google OAuth deaktiviert

**Status:** Implementiert aber ausgeblendet

**Aktivierung:**
1. Google Cloud Console: OAuth Client erstellen
2. Supabase Dashboard: Google Provider aktivieren
3. Code: Kommentare in `login-form.tsx` und `signup-form.tsx` entfernen

### Mobile App

**Status:** Keine native App

Die Web-App ist als PWA optimiert und funktioniert auf Mobilgeräten.

---

## 15. SQL-Referenz

### Neue Tabellen erstellen

#### hidden_conversations

```sql
CREATE TABLE hidden_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

CREATE INDEX idx_hidden_conversations_user ON hidden_conversations(user_id);
CREATE INDEX idx_hidden_conversations_conversation ON hidden_conversations(conversation_id);

ALTER TABLE hidden_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hidden conversations"
  ON hidden_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can hide conversations they participate in"
  ON hidden_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unhide their own conversations"
  ON hidden_conversations FOR DELETE
  USING (auth.uid() = user_id);
```

#### bug_reports

```sql
CREATE TABLE bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  area TEXT NOT NULL,
  description TEXT NOT NULL,
  worked_before TEXT,
  expected_behavior TEXT,
  screencast_url TEXT,
  screenshots TEXT[],
  status TEXT DEFAULT 'open',
  admin_notes TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_bug_reports_user ON bug_reports(user_id);
CREATE INDEX idx_bug_reports_status ON bug_reports(status);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bug reports"
  ON bug_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bug reports"
  ON bug_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Admin hinzufügen

```sql
-- User-ID herausfinden
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Als Admin hinzufügen
INSERT INTO super_admins (user_id, role)
VALUES ('user-uuid', 'super_admin');
```

### User sperren

```sql
UPDATE profiles SET is_banned = true WHERE id = 'user-uuid';
```

### Alle Fahrten eines Users löschen

```sql
DELETE FROM rides WHERE user_id = 'user-uuid';
```

### Statistiken abrufen

```sql
-- Aktive User (letzte 7 Tage)
SELECT COUNT(*) FROM profiles
WHERE last_seen_at > NOW() - INTERVAL '7 days';

-- Fahrten pro Typ
SELECT type, COUNT(*) FROM rides
WHERE status = 'active'
GROUP BY type;

-- Nachrichten pro Tag (letzte 30 Tage)
SELECT DATE(created_at) as day, COUNT(*)
FROM messages
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY day DESC;
```

---

## Kontakt & Support

- **Email:** info@carcashflow.de
- **Bug Reports:** In-App unter Hilfe → Fehler melden

---

*Letzte Aktualisierung: Februar 2025*
