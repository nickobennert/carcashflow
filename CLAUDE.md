# Carcashflow - Mitfahrbörse für Schulungsteilnehmer

## Projekt-Übersicht

**Carcashflow** ist eine Webanwendung (Mitfahrbörse) für aktive Teilnehmer einer Schulung, um Rückfahrten effizient zu organisieren. Die Funktion dient ausschließlich der Kontaktanbahnung zwischen Mitgliedern - keine Vermittlung, keine Prüfung, keine Haftung durch den Betreiber.

**Status:** MVP Development
**Stack:** Next.js 15+ (App Router), React 19, TypeScript (strict), Tailwind CSS 4, shadcn/ui, Motion, Supabase, Vercel, Stripe

---

## 1. Tech Stack & Architektur

### Frontend
| Technologie | Verwendung |
|-------------|------------|
| **Next.js 15+** | App Router Framework |
| **React 19** | UI Library |
| **TypeScript** | Strict Mode |
| **Tailwind CSS 4** | Styling |
| **shadcn/ui** | UI Komponenten (Radix-basiert) |
| **Motion** | Animationen (motion.dev) - Page Transitions, Stagger, Micro-Interactions |
| **Lucide React** | Icons |
| **next-themes** | Dark/Light Mode |
| **nuqs** | URL State Management |

### Backend & Services
| Service | Verwendung |
|---------|------------|
| **Supabase** | PostgreSQL, Auth (Email), Storage, Realtime |
| **Vercel** | Hosting & Deployment |
| **GitHub** | Version Control |

---

## 1.1 Design System

### UI Framework
- **shadcn/ui** als Basis (alle Komponenten installiert)
- **Motion** (motion.dev) für alle Animationen
- **Lucide React** für konsistente Icons

### Farbschema (shadcn Zinc + Custom Accent)

```css
/* globals.css - Light Mode */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;

  /* Custom Semantic Colors */
  --offer: 142 76% 36%;           /* Grün - Biete Fahrt */
  --offer-foreground: 0 0% 100%;
  --request: 217 91% 60%;         /* Blau - Suche Fahrt */
  --request-foreground: 0 0% 100%;
  --success: 142 76% 36%;
  --warning: 38 92% 50%;
}

/* Dark Mode */
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;

  /* Custom Semantic Colors - Dark */
  --offer: 142 70% 45%;
  --request: 217 85% 55%;
}
```

### Animation Standards (Motion)

```typescript
// lib/animations.ts
import { Variants } from "motion/react"

// Standard Fade In
export const fadeIn: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

// Stagger Container für Listen
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

// Stagger Item
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
}

// Card Hover
export const cardHover = {
  whileHover: { scale: 1.02, y: -4 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 17 }
}

// Button Press
export const buttonPress = {
  whileTap: { scale: 0.95 },
  transition: { type: "spring", stiffness: 400, damping: 17 }
}

// Modal/Dialog
export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: { opacity: 0, scale: 0.95, y: 20 }
}

// Slide In (für Toasts, Sidebars)
export const slideInRight: Variants = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 }
}

export const slideInLeft: Variants = {
  initial: { x: "-100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "-100%", opacity: 0 }
}

// Page Transition
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

// Standard Transition Config
export const defaultTransition = {
  duration: 0.3,
  ease: "easeOut"
}

export const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 17
}
```

### Micro-Interactions Richtlinien
- **Cards:** Subtle lift (y: -4) + scale (1.02) auf Hover
- **Buttons:** Scale down (0.95) auf Press
- **Page Transitions:** Fade + slight Y-movement (8px)
- **Listen:** Stagger-Animation beim Laden (0.05s pro Item)
- **Modals:** Scale (0.95 → 1) + Fade mit Spring
- **Toast Notifications:** Slide-in von rechts
- **Tabs:** Underline mit layoutId für smooth transition
- **Skeleton Loading:** Pulse Animation

### Beispiel: Animated Card Component

```tsx
// components/ui/animated-card.tsx
"use client"

import { motion } from "motion/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cardHover } from "@/lib/animations"
import { cn } from "@/lib/utils"

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function AnimatedCard({ children, className, onClick }: AnimatedCardProps) {
  return (
    <motion.div
      {...cardHover}
      onClick={onClick}
      className={cn("cursor-pointer", className)}
    >
      <Card className="h-full">
        {children}
      </Card>
    </motion.div>
  )
}
```

### Beispiel: Staggered List

```tsx
// components/rides/ride-list.tsx
"use client"

import { motion } from "motion/react"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { RideCard } from "./ride-card"
import type { Ride } from "@/types"

export function RideList({ rides }: { rides: Ride[] }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {rides.map((ride) => (
        <motion.div key={ride.id} variants={staggerItem}>
          <RideCard ride={ride} />
        </motion.div>
      ))}
    </motion.div>
  )
}
```

---

## 1.2 Setup Commands

### Initiale Installation (bereits erledigt)
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
npm install @supabase/supabase-js
```

### shadcn/ui initialisieren
```bash
npx shadcn@latest init
# Style: Default
# Base color: Zinc  
# CSS variables: Yes
```

### Alle benötigten shadcn Components
```bash
npx shadcn@latest add button card input label textarea select dialog sheet toast avatar badge tabs separator dropdown-menu alert checkbox radio-group switch form table skeleton popover command calendar
```

### Motion installieren
```bash
npm install motion
```

### Weitere Dependencies
```bash
npm install next-themes lucide-react nuqs date-fns
npm install -D @types/node
```

---

## 2. Projektstruktur

```
src/
├── app/
│   ├── (authenticated)/      # Protected pages
│   │   ├── dashboard/        # Mitfahrbörse Hauptansicht
│   │   ├── messages/         # Internes Nachrichtensystem
│   │   ├── profile/          # Eigenes Profil bearbeiten
│   │   ├── settings/         # Account Settings
│   │   ├── changelog/        # App Updates
│   │   └── pricing/          # Subscription Pläne
│   ├── api/
│   │   ├── rides/            # CRUD für Mitfahrangebote/-gesuche
│   │   ├── messages/         # Nachrichtensystem
│   │   ├── connections/      # Freundschaftssystem
│   │   ├── reports/          # Meldefunktion
│   │   ├── settings/         # Profile & Account
│   │   ├── subscription/     # Stripe Integration
│   │   ├── stripe/           # Webhooks
│   │   ├── admin/            # SuperAdmin Funktionen
│   │   └── notifications/    # Push & In-App
│   ├── auth/
│   │   ├── callback/         # OAuth Callback
│   │   └── redirect/         # Post-Auth Handler
│   ├── login/
│   ├── signup/
│   └── u/[username]/         # Öffentliche Profilseite
├── components/
│   ├── ui/                   # shadcn/ui + Custom Animated
│   ├── layout/               # App Shell, Sidebar, Header
│   ├── rides/                # Ride Cards, Forms
│   ├── messages/             # Chat Components
│   ├── profile/              # Profile Components
│   └── subscription/         # Paywall, Trial Banner
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser Client
│   │   └── server.ts         # Server Client
│   ├── animations.ts         # Motion Variants & Configs
│   └── utils.ts
├── hooks/
│   ├── use-subscription.ts   # Subscription Status Hook
│   └── use-realtime.ts       # Supabase Realtime Hook
├── types/
│   └── index.ts
└── middleware.ts             # Auth & Subscription Protection
```

---

## 3. Datenbank-Schema

### Core Tables

#### `profiles` (User Profile - SEHR WICHTIG)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basis Info
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,

  -- Detailliertes Profil
  bio TEXT,
  phone TEXT,
  city TEXT,                    -- Wohnort für besseres Matching

  -- Schulungs-Info
  training_location TEXT,       -- Schulungsort
  training_date DATE,           -- Schulungsdatum

  -- Social
  is_public BOOLEAN DEFAULT true,

  -- Preferences
  theme_preference TEXT DEFAULT 'system',
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "new_message": true, "new_ride": false}',

  -- Subscription (User-basiert, nicht Org-basiert)
  subscription_tier TEXT DEFAULT 'trial',
  subscription_status TEXT DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  is_lifetime BOOLEAN DEFAULT false,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);

-- Trigger für automatische Profile-Erstellung bei Signup
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, username, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTRING(NEW.id::text, 1, 4),
    NOW() + INTERVAL '30 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

#### `connections` (Freundschaften)
```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(requester_id, addressee_id)
);
```

#### `rides` (Mitfahrangebote & Gesuche)
```sql
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Typ
  type TEXT NOT NULL, -- 'offer' (Biete) oder 'request' (Suche)

  -- Route
  start_location TEXT NOT NULL,
  start_lat DECIMAL(10, 8),
  start_lng DECIMAL(11, 8),
  end_location TEXT NOT NULL,
  end_lat DECIMAL(10, 8),
  end_lng DECIMAL(11, 8),

  -- Zeit
  departure_date DATE NOT NULL,
  departure_time TIME,          -- Optional: Genaue Uhrzeit
  time_flexibility TEXT,        -- 'morning', 'afternoon', 'evening', 'flexible'

  -- Details
  seats_available INTEGER DEFAULT 1,
  cost_sharing TEXT,            -- Optional: Kostenhinweis
  comment TEXT,                 -- Optional: Zusätzlicher Kommentar

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'expired'
  expires_at TIMESTAMPTZ,       -- Auto-expire nach 7-14 Tagen

  -- Meta
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index für Suche
CREATE INDEX idx_rides_active ON rides(status, departure_date) WHERE status = 'active';
CREATE INDEX idx_rides_locations ON rides(start_location, end_location);
```

#### `messages` (Internes Nachrichtensystem)
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
```

#### `reports` (Meldefunktion)
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- 'spam', 'inappropriate', 'fake', 'harassment', 'other'
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
);
```

#### `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'new_message', 'connection_request', 'ride_match', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `subscription_tiers` (Reference Table)
```sql
CREATE TABLE subscription_tiers (
  id TEXT PRIMARY KEY, -- 'trial', 'basic', 'premium', 'lifetime'
  name TEXT NOT NULL,
  price_monthly INTEGER, -- in cents
  features JSONB,
  is_active BOOLEAN DEFAULT true
);

INSERT INTO subscription_tiers (id, name, price_monthly, features) VALUES
  ('trial', 'Testphase', 0, '{"rides_per_month": 5, "messages": true, "connections": 10}'),
  ('basic', 'Basis', 499, '{"rides_per_month": 20, "messages": true, "connections": 50}'),
  ('premium', 'Premium', 999, '{"rides_per_month": -1, "messages": true, "connections": -1, "priority_support": true}'),
  ('lifetime', 'Lifetime', 0, '{"rides_per_month": -1, "messages": true, "connections": -1, "priority_support": true}');
```

#### `super_admins`
```sql
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin', -- 'super_admin', 'admin', 'moderator'
  permissions JSONB DEFAULT '{}',
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `promo_codes`
```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'percent_discount', 'fixed_discount', 'free_months', 'lifetime_free'
  value INTEGER,
  duration_months INTEGER,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES promo_codes(id),
  user_id UUID REFERENCES profiles(id),
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(code_id, user_id)
);
```

#### `legal_acceptances` (Rechtliche Zustimmungen)
```sql
CREATE TABLE legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  acceptance_type TEXT NOT NULL, -- 'rideshare_terms', 'privacy_policy', 'terms_of_service'
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  UNIQUE(user_id, acceptance_type)
);
```

---

## 4. Auth Flow

### SignUp Flow
1. User navigiert zu `/signup`
2. Formular: Email, Password, Vorname
3. Supabase Auth erstellt User
4. Trigger erstellt automatisch Profile mit generiertem Username + 30 Tage Trial
5. Redirect zu `/auth/redirect`
6. Redirect zu `/profile/setup` (Profil vervollständigen)

### Login Flow
1. User navigiert zu `/login`
2. Email/Password (Google OAuth implementiert aber ausgeblendet)
3. Callback tauscht Code gegen Session
4. Redirect zu `/dashboard`

### Google OAuth (Deaktiviert)
Google OAuth ist vollständig implementiert, aber derzeit ausgeblendet.
- **Dateien:** `login-form.tsx`, `signup-form.tsx` (auskommentierter Code)
- **Aktivierung:** Kommentare in den Dateien entfernen
- **Voraussetzung:** Google OAuth Provider in Supabase Dashboard konfigurieren
  1. Supabase Dashboard → Authentication → Providers → Google
  2. Google Cloud Console: OAuth 2.0 Client erstellen
  3. Redirect URI: `https://[PROJECT_REF].supabase.co/auth/v1/callback`

### Middleware Protection
```typescript
// middleware.ts
const protectedRoutes = ['/dashboard', '/messages', '/profile', '/settings']
const subscriptionRequiredRoutes = ['/dashboard', '/messages']

// Check: User eingeloggt?
// Check: Profil vollständig?
// Check: Subscription aktiv oder Trial?
// Check: Legal Terms akzeptiert?
```

---

## 5. Subscription System

### Wichtig: User-basiert (nicht Organization-basiert)
Die Subscription ist direkt am User-Profil, keine Organizations.

### Trial Logik
- Erster Monat nach Schulungsende automatisch freigeschaltet
- `trial_ends_at` wird bei Signup auf +30 Tage gesetzt
- Nach Ablauf: Zugriff nur bei aktivem Abo

### Subscription Status
```typescript
type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'frozen' | 'lifetime'
type SubscriptionTier = 'trial' | 'basic' | 'premium' | 'lifetime'
```

### Frozen State
- Bei `subscription_status === 'frozen'`: Modal erzwingt Subscription-Auswahl
- Kein Zugriff auf Dashboard/Messages
- Nur Settings & Pricing erreichbar

### Stripe Integration Pattern
```typescript
// POST /api/subscription/checkout
// - Prüft User Auth
// - Erstellt/Holt Stripe Customer
// - Erstellt Checkout Session
// - Redirect zu Stripe

// POST /api/stripe/webhook
// - checkout.session.completed → aktiviert Subscription
// - customer.subscription.updated → synced Status
// - customer.subscription.deleted → setzt auf frozen
```

---

## 6. Kernfunktionen

### 6.1 Mitfahrbörse (Dashboard)

**Listenansicht:**
- Karten-Layout für Angebote/Gesuche mit Stagger Animation
- Farbcodierung: Grün (`--offer`) = Biete, Blau (`--request`) = Suche
- Sortierung nach Datum (neueste zuerst)
- Filter: Startort, Zielort, Datum, Typ

**Eintrag erstellen:**
```typescript
interface CreateRideForm {
  type: 'offer' | 'request'
  start_location: string    // Pflicht
  end_location: string      // Pflicht
  departure_date: Date      // Pflicht
  departure_time?: string   // Optional
  time_flexibility?: string // Optional
  seats_available: number   // Pflicht bei 'offer'
  cost_sharing?: string     // Optional
  comment?: string          // Optional
}
```

**Auto-Expire:**
- Einträge laufen nach 7 Tagen automatisch ab
- Cron Job oder Supabase Edge Function

### 6.2 Kontaktaufnahme

**Wichtig:** Keine öffentlichen Kontaktdaten!

**Flow:**
1. User klickt "Kontakt aufnehmen" auf Ride-Card
2. System erstellt/öffnet Conversation mit Bezug zur Fahrt
3. User kann Nachricht senden
4. Ride-Owner erhält Notification

### 6.3 Nachrichtensystem

**Features:**
- Conversation-basiert (nicht 1:1 Chat)
- Bezug zu Ride (optional)
- Unread-Counter mit Badge Animation
- Realtime Updates (Supabase Realtime)

### 6.4 Profil-System

**Öffentliches Profil (`/u/[username]`):**
- Avatar, Name, Bio
- Stadt, Schulungsort
- Mitglied seit
- Aktive Angebote/Gesuche (wenn public)

**Privates Profil bearbeiten:**
- Alle Felder editierbar
- Avatar Upload (Supabase Storage)
- Visibility Toggle

### 6.5 Freundschaftssystem

**Flow:**
1. User A sendet Connection Request
2. User B sieht Request in Notifications
3. User B akzeptiert/ablehnt
4. Bei Akzeptanz: Beide sehen erweiterte Profile

---

## 7. Rechtliche Absicherung

### Pflicht-Hinweis (MUSS)
Fester Hinweis oberhalb der Mitfahrbörse:
> "Diese Funktion dient ausschließlich der Kontaktanbahnung. Es findet keine Vermittlung oder Haftung statt. Absprachen erfolgen eigenverantwortlich zwischen den Nutzern."

### Erste Zustimmung
Beim ersten Zugriff auf `/dashboard`:
1. Modal mit Terms anzeigen (animated mit Motion)
2. Checkbox: "Ich habe die Bedingungen gelesen und akzeptiert"
3. Speichern in `legal_acceptances`
4. Ohne Zustimmung kein Zugriff

---

## 8. Admin & Moderation

### SuperAdmin Dashboard (`/admin`)
- Statistiken: User, Rides, Messages
- User-Liste mit Suche/Filter
- Reports-Queue
- Promo Code Management
- Subscription-Verwaltung (manuell ändern)

### Moderations-Features
- Reports einsehen & bearbeiten
- User sperren/entsperren
- Rides löschen/ausblenden
- Broadcast-Nachrichten

---

## 9. Settings

### Tabs (mit animated underline):
1. **Profil** - Name, Avatar, Bio, Stadt
2. **Account** - Email, Passwort, Account löschen
3. **Benachrichtigungen** - Email, Push, Preferences
4. **Subscription** - Aktueller Plan, Upgrade, Portal
5. **Datenschutz** - Profil-Sichtbarkeit, Daten exportieren

---

## 10. Changelog

**Pattern:** Statisches Array mit Entries
```typescript
interface ChangelogEntry {
  id: string
  date: Date
  title: string
  description: string
  type: 'feature' | 'improvement' | 'fix'
  highlights?: string[]
}
```

**UI:**
- Timeline-Ansicht mit Stagger Animation
- Infinite Scroll
- Type-basierte Farbcodierung (Badge)

---

## 11. Code Konventionen

### TypeScript
- Strict Mode
- Path Alias: `@/*` -> `./src/*`
- Keine `any` Types
- Interfaces für alle API Responses

### "use client"
Nur verwenden wenn:
- React Hooks (useState, useEffect)
- Event Handler (onClick)
- Browser APIs (window, localStorage)
- Motion Animationen

### Animationen
- Alle Animationen über motion.dev (nicht CSS transitions)
- Keine Animationen über 300ms (außer Page Transitions)
- `prefers-reduced-motion` respektieren:
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
```
- Stagger max 0.05s pro Item
- Spring für interaktive Elemente (Buttons, Cards)
- Ease-out für Enter, Ease-in für Exit

### Sprache
- **UI:** Deutsch
- **Code/Comments:** Englisch
- **Commit Messages:** Englisch (Conventional Commits)

### Import Reihenfolge
1. React
2. Next.js
3. Motion
4. Externe Libraries
5. UI Components (`@/components/ui/`)
6. Lokale Components
7. Lib/Hooks
8. Types

### Commit Message Format
```
feat: add ride creation form
fix: resolve message notification bug
style: update card hover animation
refactor: extract animation variants
docs: update README
```

---

## 12. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_BASIC=
STRIPE_PRICE_ID_PREMIUM=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 13. Wichtige Patterns

### Parallel Queries
```typescript
const [profile, subscription, rides] = await Promise.all([
  supabase.from("profiles").select().single(),
  supabase.from("profiles").select("subscription_*").single(),
  supabase.from("rides").select().eq("user_id", user.id)
])
```

### Permission Check
```typescript
// In API Routes
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

// Subscription Check
const { data: profile } = await supabase
  .from("profiles")
  .select("subscription_status")
  .eq("id", user.id)
  .single()

if (profile?.subscription_status === 'frozen') {
  return NextResponse.json({ error: "Subscription required" }, { status: 403 })
}
```

### Selective Updates
```typescript
const updateData: Record<string, unknown> = {}
if (first_name !== undefined) updateData.first_name = first_name
if (bio !== undefined) updateData.bio = bio
// Only update provided fields
```

### Animated Page Wrapper
```typescript
// components/layout/page-wrapper.tsx
"use client"

import { motion } from "motion/react"
import { pageTransition } from "@/lib/animations"

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}
```

---

## 14. Nicht-Ziele (explizit NICHT implementieren)

- Keine Zahlungsabwicklung zwischen Usern
- Keine Buchungsfunktion
- Kein automatisches Matching
- Keine Verantwortung/Prüfung durch Betreiber
- Keine öffentlichen Kontaktdaten
- Keine Organization/Team Features

---

## 15. MVP Prioritäten

### Phase 1 (MUSS)
1. Auth (Signup, Login, OAuth)
2. Profil-System (Basis)
3. Rides CRUD
4. Listenansicht mit Filter
5. Kontaktaufnahme (Messages Basis)
6. Legal Acceptance Modal
7. Trial/Subscription Basis

### Phase 2 (SOLL)
1. Push Notifications
2. Realtime Messages
3. Connection System
4. Reports/Moderation
5. Admin Dashboard
6. Promo Codes

### Phase 3 (NICE-TO-HAVE)
1. Bewertungssystem
2. Ride-History
3. Advanced Matching
4. PWA Support
