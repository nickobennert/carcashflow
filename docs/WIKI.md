# Fahr mit! - Developer Wiki

> **Version:** MVP 1.0 | **Stand:** Februar 2026 | **Stack:** Next.js 15 + Supabase

---

## 1. Projektübersicht

**Fahr mit!** ist eine Mitfahrbörse für Schulungsteilnehmer. Die Plattform verbindet Nutzer, die Fahrten anbieten oder suchen. Es handelt sich ausschließlich um **Kontaktanbahnung** - keine Vermittlung, keine Haftung.

### Feature-Status

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Registrierung & Login | **Aktiv** | Email/Passwort via Supabase Auth |
| Google OAuth | **Deaktiviert** | Code vorhanden, aber auskommentiert |
| Profil-System | **Aktiv** | Profil bearbeiten, Avatar, City |
| Mitfahrbörse (Dashboard) | **Aktiv** | Fahrten erstellen, filtern, ansehen |
| Multi-Stopp-Routen | **Aktiv** | Start, Zwischenstopps, Ziel mit Geocoding |
| Route-Matching | **Aktiv** | Automatischer Abgleich passender Fahrten (max. 30km) |
| Wiederkehrende Fahrten | **Aktiv** | Wöchentlich wiederholende Fahrten |
| Nachrichten-System | **Aktiv** | 1:1 Chat mit Realtime-Updates |
| Typing-Indicator | **Aktiv** | Zeigt an wenn jemand tippt |
| Online-Status | **Aktiv** | Grüner Punkt bei Online-Usern |
| Chat entfernen | **Aktiv** | Soft-Delete pro User (nicht permanent) |
| Push Notifications | **Aktiv** | Web Push bei neuen Nachrichten |
| In-App Notifications | **Aktiv** | Glocke mit Unread-Badge |
| Route-Watches | **Aktiv** | Automatische Benachrichtigung bei passenden neuen Fahrten |
| Bug Reports | **Aktiv** | User können Fehler mit Screenshots melden |
| Admin-Panel | **Aktiv** | Statistiken, User-Verwaltung, Bug Reports (in Settings) |
| Docs/Wiki | **Aktiv** | Diese Seite unter `/admin/docs` |
| E2E-Verschlüsselung | **Deaktiviert** | Entfernt - nicht zuverlässig in Web-Apps |
| Bezahlsystem | **Geplant** | Für spätere Phase geplant (Anbieter noch offen) |

---

## 2. Tech Stack

### Frontend

| Technologie | Verwendung |
|-------------|------------|
| **Next.js 15** | App Router, Server Components, Middleware |
| **React 19** | UI mit Hooks, Client Components |
| **TypeScript** (strict) | Durchgehende Typisierung |
| **Tailwind CSS 4** | Utility-first Styling |
| **shadcn/ui** | UI-Komponenten auf Radix-Basis |
| **Motion** (motion.dev) | Animationen: Stagger, Hover, Page Transitions |
| **Lucide React** | Icon-Library |
| **next-themes** | Dark/Light Mode Toggle |
| **nuqs** | URL-basiertes State Management (Filter etc.) |
| **date-fns** | Datums-Formatierung |
| **sonner** | Toast Notifications |
| **react-markdown** | Markdown-Rendering (Docs-Seite) |

### Backend

| Service | Verwendung |
|---------|------------|
| **Supabase** | PostgreSQL-Datenbank, Auth, Realtime, Storage |
| **Vercel** | Hosting, CI/CD, Serverless Functions |
| **GitHub** | Repository, Auto-Deploy bei Push auf `main` |

### Externe APIs

| API | Endpunkt | Wofür |
|-----|----------|-------|
| **Photon** (Komoot) | `photon.komoot.io` | Adresssuche / Geocoding |
| **OSRM** | `router.project-osrm.org` | Routen-Berechnung und Polylines |

---

## 3. Projektstruktur

```text
src/
  app/
    (authenticated)/          # Alle Seiten die Login brauchen
      dashboard/              # Mitfahrbörse - Hauptseite
      messages/               # Chat-Übersicht
        [id]/                 # Einzelner Chat
      profile/                # Eigenes Profil bearbeiten
      settings/               # Einstellungen + Admin-Tab
      help/                   # Hilfe & Bug melden
      changelog/              # App-Updates
    admin/
      docs/                   # Diese Wiki-Seite
    api/
      rides/                  # GET, POST, PATCH, DELETE
        match/                # Route-Matching Algorithmus
      messages/               # Nachrichten senden
      conversations/          # Chat erstellen/laden
      notifications/          # In-App Benachrichtigungen
      push/                   # Web Push subscribe/unsubscribe
      bug-report/             # Bug Reports CRUD
      settings/               # Profil-Updates, Avatar-Upload
      admin/                  # Stats, Users, Bug Reports (Service Role)
    auth/
      callback/               # Supabase Auth Callback
      redirect/               # Post-Login Redirect
    login/
    signup/

  components/
    ui/                       # shadcn/ui Basis-Komponenten
    layout/                   # AppShell, Sidebar, Header, MobileNav
    rides/                    # RideCard, CreateRideForm, Filters
    messages/                 # ConversationList, ConversationView
    notifications/            # NotificationDropdown, Badge
    settings/                 # AdminTab, ProfileForm
    help/                     # BugReportModal

  lib/
    supabase/
      client.ts               # Browser-Client (mit Anon Key)
      server.ts               # Server-Client (mit Cookies)
      admin.ts                # Service Role Client (nur API!)
    push/
      server.ts               # Web Push senden
    animations.ts             # Motion Variants (fadeIn, stagger, etc.)
    utils.ts                  # cn(), formatDate(), etc.

  hooks/
    use-notification-sound.ts # Sound bei neuer Nachricht
    use-unread-messages.ts    # Ungelesene Nachrichten zählen

  middleware.ts               # Auth-Check für geschützte Routen
```

---

## 4. Datenbank-Schema

### Tabellen-Übersicht

| Tabelle | Zweck | RLS |
|---------|-------|-----|
| `profiles` | Nutzerprofile (erweitert `auth.users`) | Ja |
| `rides` | Mitfahrangebote und -gesuche | Ja |
| `conversations` | Chat-Verbindungen (2 Teilnehmer) | Ja |
| `messages` | Chat-Nachrichten | Ja |
| `hidden_conversations` | Entfernte Chats (Soft-Delete pro User) | Ja |
| `notifications` | In-App Benachrichtigungen | Ja |
| `push_subscriptions` | Web Push Endpoints | Ja |
| `bug_reports` | Fehlermeldungen von Usern | Ja |
| `route_watches` | Gespeicherte Routen-Alerts | Ja |
| `super_admins` | Admin-Berechtigungen | Ja |

### profiles

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

Wird automatisch bei Registrierung erstellt (via Trigger `handle_new_user`). Der Username wird generiert aus Email-Prefix + erste 4 Zeichen der User-ID.

### rides

```sql
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,            -- 'offer' oder 'request'
  route JSONB NOT NULL,          -- Array von RoutePoints (siehe unten)
  departure_date DATE NOT NULL,
  departure_time TIME,
  seats_available INTEGER DEFAULT 1,
  comment TEXT,
  status TEXT DEFAULT 'active',  -- 'active', 'completed', 'cancelled', 'expired'
  is_recurring BOOLEAN DEFAULT false,
  recurring_days INTEGER[],      -- z.B. [1,3,5] = Mo,Mi,Fr
  recurring_until DATE,
  parent_ride_id UUID,
  route_geometry JSONB,          -- OSRM Polyline
  route_distance INTEGER,        -- Meter
  route_duration INTEGER,        -- Sekunden
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ         -- Auto-Expire nach 7 Tagen
);
```

**Route-Punkte** werden als JSON-Array gespeichert:

```typescript
interface RoutePoint {
  type: "start" | "stop" | "end"
  address: string
  lat?: number
  lng?: number
  order: number
}
```

### conversations + messages

```sql
-- Jede Conversation hat genau 2 Teilnehmer
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES profiles(id),
  participant_2 UUID NOT NULL REFERENCES profiles(id),
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_1, participant_2)  -- Normalisiert: kleinere UUID zuerst
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### hidden_conversations (Chat entfernen)

```sql
CREATE TABLE hidden_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);
```

**So funktioniert "Chat entfernen":**
1. User A klickt "Entfernen" - Eintrag in `hidden_conversations` wird erstellt
2. Chat verschwindet nur fuer User A, User B sieht ihn weiterhin
3. Wenn User B eine neue Nachricht schickt, wird der `hidden_conversations`-Eintrag geloescht und der Chat taucht wieder auf
4. Wenn **beide** User den Chat entfernen, wird die Conversation samt Nachrichten permanent geloescht

### bug_reports

```sql
CREATE TABLE bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  area TEXT NOT NULL,           -- 'dashboard', 'messages', 'profile', etc.
  description TEXT NOT NULL,
  worked_before TEXT,
  expected_behavior TEXT,
  screenshots TEXT[],           -- Array von Storage-URLs
  status TEXT DEFAULT 'open',   -- 'open', 'in_progress', 'resolved', 'wont_fix'
  admin_notes TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
);
```

### route_watches

```sql
CREATE TABLE route_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,            -- 'location' oder 'route'
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  radius INTEGER,                -- km
  address TEXT,
  start_lat DECIMAL(10, 8),
  start_lng DECIMAL(11, 8),
  start_address TEXT,
  end_lat DECIMAL(10, 8),
  end_lng DECIMAL(11, 8),
  end_address TEXT,
  ride_type TEXT DEFAULT 'both', -- 'offer', 'request', 'both'
  created_at TIMESTAMPTZ DEFAULT now(),
  last_notified_at TIMESTAMPTZ
);
```

User koennen Routen oder Orte speichern und werden automatisch benachrichtigt, wenn neue passende Fahrten erstellt werden.

---

## 5. Authentifizierung

**Status: Aktiv** - Email/Passwort Login

### So funktioniert der Flow

```text
Registrierung:
  User fuellt Formular aus (Email, Passwort, Vorname)
  -> Supabase erstellt Auth-User
  -> Trigger erstellt Profil mit generiertem Username
  -> User bekommt Bestaetigungs-Email
  -> Nach Klick auf Link: Redirect zu /dashboard

Login:
  Email + Passwort eingeben
  -> Supabase validiert Credentials
  -> Session Cookie wird gesetzt
  -> Redirect zu /dashboard
```

### Middleware

Die Datei `middleware.ts` prueft bei jedem Request:
- Ist der User eingeloggt? Wenn nicht, Redirect zu `/login`
- Geschuetzte Routen: `/dashboard`, `/messages`, `/profile`, `/settings`

### Google OAuth

**Status: Deaktiviert** - Der Code ist vorhanden, aber auskommentiert.

So aktivierst du Google OAuth:
1. Google Cloud Console: OAuth 2.0 Client ID erstellen
2. Supabase Dashboard > Authentication > Providers > Google aktivieren
3. Redirect URI eintragen: `https://[PROJECT_REF].supabase.co/auth/v1/callback`
4. In `login-form.tsx` und `signup-form.tsx` die Google-Buttons einkommentieren

---

## 6. Nachrichtensystem

**Status: Aktiv** - 1:1 Chat mit Realtime

### So funktioniert es

1. User klickt auf einer Fahrt auf "Nachricht senden"
2. System erstellt oder oeffnet eine Conversation (immer nur 1 pro User-Paar)
3. Nachrichten werden in Echtzeit ueber Supabase Realtime synchronisiert
4. Der andere User bekommt eine Push Notification + In-App Notification

### Realtime-Kanäle

Es gibt 3 Echtzeit-Funktionen:

**Neue Nachrichten** - ueber `postgres_changes`:
```typescript
supabase
  .channel(`conversation:${conversationId}`)
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "messages",
    filter: `conversation_id=eq.${conversationId}`,
  }, handleNewMessage)
  .subscribe()
```

**Typing-Indicator** - ueber Broadcast:
```typescript
// Senden: "Ich tippe gerade"
channel.send({
  type: "broadcast",
  event: "typing",
  payload: { user_id: myUserId }
})
```

**Online-Status** - ueber Presence:
```typescript
// Andere User sehen ob du online bist
channel.track({ user_id: myUserId, online_at: new Date() })
```

### E2E-Verschluesselung

**Status: Deaktiviert** (seit Februar 2025)

Wurde entfernt weil Web-Apps Krypto-Schluessel nicht zuverlaessig speichern koennen (IndexedDB kann jederzeit vom Browser geloescht werden). Aktuelle Sicherheit:
- TLS/HTTPS fuer alle Verbindungen
- Supabase verschluesselt Daten at rest
- Row Level Security (RLS) beschraenkt Zugriff
- User sehen nur ihre eigenen Chats

Das entspricht dem Sicherheitsniveau von Slack, Discord oder Teams.

---

## 7. Fahrten-System (Rides)

**Status: Aktiv** - Erstellen, Suchen, Filtern, Matching

### Fahrten-Typen

- **offer** (gruen): User bietet eine Mitfahrgelegenheit an
- **request** (blau): User sucht eine Mitfahrgelegenheit

### API-Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| `GET` | `/api/rides` | Alle aktiven Fahrten laden |
| `POST` | `/api/rides` | Neue Fahrt erstellen |
| `GET` | `/api/rides/[id]` | Einzelne Fahrt laden |
| `PATCH` | `/api/rides/[id]` | Fahrt aktualisieren |
| `DELETE` | `/api/rides/[id]` | Fahrt loeschen |
| `POST` | `/api/rides/match` | Passende Fahrten finden |

### Route-Matching

Wenn ein User eine Fahrt erstellt, sucht das System automatisch nach passenden Gegenparts:

```text
1. Berechne Entfernung vom eigenen Start zu allen anderen Starts
2. Berechne Entfernung vom eigenen Ziel zu allen anderen Zielen
3. Filtere: Max 30km Abweichung
4. Sortiere nach geringster Gesamtabweichung
5. Benachrichtige User mit Route-Watches
```

### Wiederkehrende Fahrten

User koennen Fahrten als wiederkehrend markieren:

```typescript
{
  is_recurring: true,
  recurring_days: [1, 3, 5],    // 0=So, 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa
  recurring_until: "2026-06-30"
}
```

Das System erstellt automatisch einzelne Ride-Eintraege fuer jeden Tag.

### Auto-Expire

Einmalige Fahrten laufen nach 7 Tagen automatisch ab (Feld `expires_at`).

---

## 8. Push Notifications

**Status: Aktiv** - Web Push bei neuen Nachrichten

### Voraussetzungen

VAPID Keys muessen gesetzt sein:

```bash
# Keys generieren
npx web-push generate-vapid-keys
```

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=dein_public_key
VAPID_PRIVATE_KEY=dein_private_key
```

### So funktioniert es

```text
1. User aktiviert Push in Einstellungen
2. Browser fragt um Erlaubnis
3. Service Worker (public/sw.js) registriert Push-Subscription
4. Subscription wird in der Tabelle push_subscriptions gespeichert
5. Bei neuer Nachricht: Server sendet Push ueber Web Push Protocol
6. Service Worker zeigt Notification an
```

### Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| `POST` | `/api/push/subscribe` | Push-Subscription registrieren |
| `DELETE` | `/api/push/subscribe` | Push-Subscription entfernen |
| `POST` | `/api/push/test` | Test-Push senden (nur Debug) |

---

## 9. Bug Reports

**Status: Aktiv**

### User-Flow

1. User oeffnet `/help` und klickt "Fehler melden"
2. Formular: Titel, Bereich (Dropdown), Beschreibung, Optional: Screenshots
3. Bug wird in `bug_reports` gespeichert, Screenshots in Supabase Storage

### Admin-Flow

1. Admin oeffnet Einstellungen > Admin-Tab > Bugs
2. Sieht alle gemeldeten Bugs mit Status-Badge
3. Kann Status aendern: `open` > `in_progress` > `resolved` / `wont_fix`
4. Admin-Queries laufen ueber `/api/admin/bug-reports` (Service Role, umgeht RLS)

### Endpoints

| Methode | Endpoint | Wer |
|---------|----------|-----|
| `POST` | `/api/bug-report` | User - Bug melden |
| `GET` | `/api/admin/bug-reports` | Admin - Alle Bugs laden |
| `PATCH` | `/api/admin/bug-reports` | Admin - Status aendern |

---

## 10. Admin-Panel

**Status: Aktiv** - Integriert in Einstellungen (kein separates `/admin`)

### Zugang

Nur User die in der Tabelle `super_admins` stehen, sehen den Admin-Tab in den Einstellungen.

### Admin hinzufuegen

```sql
-- 1. User-ID herausfinden
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- 2. Als Admin eintragen
INSERT INTO super_admins (user_id, role)
VALUES ('die-user-uuid', 'super_admin');
```

### Funktionen

| Tab | Was |
|-----|-----|
| **Uebersicht** | Stats (User, Fahrten, Nachrichten, Reports, Bugs), letzte User |
| **Nutzer** | User-Liste mit Suche, Details anzeigen |
| **Reports** | Gemeldete User/Inhalte bearbeiten (loesen/abweisen) |
| **Bugs** | Bug Reports bearbeiten (offen > in Bearbeitung > geloest) |

### Wichtig: Service Role

Admin-Queries verwenden den Service Role Key um RLS zu umgehen. Der Service Role Client darf **niemals** im Browser-Code verwendet werden:

```typescript
// NUR in API-Routes verwenden!
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

## 11. Sicherheit

### Row Level Security (RLS)

Alle Tabellen haben RLS aktiviert. Jeder User kann nur seine eigenen Daten sehen/aendern.

Beispiel fuer `messages`:

```sql
-- User sehen nur Nachrichten aus eigenen Chats
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
  )
);
```

### Supabase Clients

| Client | Datei | Verwendung | RLS |
|--------|-------|------------|-----|
| Browser | `lib/supabase/client.ts` | Client Components | Ja, mit Anon Key |
| Server | `lib/supabase/server.ts` | Server Components, API Routes | Ja, mit Session |
| Admin | `lib/supabase/admin.ts` | API Routes fuer Admin-Ops | **Nein**, Service Role |

### Datenschutz

- Telefonnummern sind privat
- User koennen Profil-Sichtbarkeit steuern
- Account-Loeschung loescht alle Daten (CASCADE)

---

## 12. Environment Variables

### Pflicht

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN...
VAPID_PRIVATE_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=https://app.carcashflow.de
```

### Vercel Setup

1. Vercel Dashboard > Project > Settings > Environment Variables
2. Alle Variablen fuer **Production** und **Preview** eintragen
3. `SUPABASE_SERVICE_ROLE_KEY` ist **nur serverseitig** (kein `NEXT_PUBLIC_` Prefix!)

---

## 13. Deployment

### Automatisch via GitHub

Jeder Push auf `main` deployed automatisch zu Vercel.

```text
git push origin main  -->  Vercel baut und deployed automatisch
```

### Manuell

```bash
# Preview Deployment
vercel

# Production Deployment
vercel --prod
```

### Build-Befehle

```bash
npm run dev       # Lokaler Dev-Server
npm run build     # Production Build
npm run start     # Production Server starten
npm run lint      # ESLint pruefen
```

---

## 14. Haeufige Admin-Befehle (SQL)

Diese Befehle kannst du direkt im Supabase SQL-Editor ausfuehren:

### User sperren

```sql
UPDATE profiles SET is_banned = true WHERE id = 'user-uuid';
```

### User entsperren

```sql
UPDATE profiles SET is_banned = false WHERE id = 'user-uuid';
```

### Alle Fahrten eines Users loeschen

```sql
DELETE FROM rides WHERE user_id = 'user-uuid';
```

### Aktive User der letzten 7 Tage

```sql
SELECT COUNT(*) FROM profiles
WHERE last_seen_at > NOW() - INTERVAL '7 days';
```

### Fahrten nach Typ zaehlen

```sql
SELECT type, COUNT(*) FROM rides
WHERE status = 'active'
GROUP BY type;
```

### Nachrichten pro Tag (letzte 30 Tage)

```sql
SELECT DATE(created_at) as tag, COUNT(*) as anzahl
FROM messages
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY tag DESC;
```

---

## Kontakt

- **Email:** info@carcashflow.de
- **Bug Reports:** In der App unter Hilfe > Fehler melden
