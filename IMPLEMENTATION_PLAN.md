# Carcashflow - Implementierungsplan

> **Erstellt:** 18. Januar 2026
> **Status:** Genehmigung ausstehend
> **Geschätzte Arbeitspakete:** 8 Phasen

---

## Übersicht

Dieser Plan adressiert:
1. **Kritische Sicherheits- & Stabilitätsprobleme** (aus Code-Analyse)
2. **Kunden-Bug-Reports** (4 gemeldete Issues)
3. **Feature-Entfernung** (Freundschaftssystem)
4. **Infrastruktur-Verbesserungen**

---

## Phase 1: Kritische Sicherheit & Stabilität
**Priorität: SOFORT**

### 1.1 Environment Variables sichern
**Problem:** `.env.local` ist im Git-Repository committed - alle Secrets sind öffentlich!

**Aktionen:**
- [ ] `.env.local` aus Git-History entfernen
- [ ] `.gitignore` aktualisieren
- [ ] Alle Secrets rotieren:
  - Supabase Anon Key
  - Supabase Service Role Key
  - Stripe Secret Key
  - Stripe Webhook Secret
- [ ] Neue Keys in Vercel Environment Variables setzen

**Dateien:**
- `.gitignore`
- `.env.local` (entfernen aus Git)
- Vercel Dashboard

---

### 1.2 Race Condition bei Conversations beheben
**Problem:** Check + Insert ohne Transaktion kann Duplikate erzeugen

**Aktionen:**
- [ ] `POST /api/conversations` refactoren
- [ ] Upsert-Pattern oder Database Constraint verwenden
- [ ] Unique Constraint auf `(participant_1, participant_2)` in DB

**Dateien:**
- `src/app/api/conversations/route.ts`
- `supabase/migrations/` (neuer Constraint)

---

### 1.3 Recurring Rides Partial-Failure beheben
**Problem:** Parent-Ride wird erstellt, aber Child-Rides können fehlschlagen ohne Rollback

**Aktionen:**
- [ ] Transaktions-Logik implementieren
- [ ] Bei Fehler: Parent-Ride löschen oder als "draft" markieren
- [ ] Besseres Error-Handling mit User-Feedback

**Dateien:**
- `src/app/api/rides/route.ts` (POST Handler)

---

### 1.4 N+1 Queries bei Conversations eliminieren
**Problem:** 100+ DB-Queries bei 50 Conversations

**Aktionen:**
- [ ] JOIN-Query statt Promise.all mit einzelnen Queries
- [ ] Subquery für `last_message` und `unread_count`
- [ ] Performance-Test mit 100+ Conversations

**Dateien:**
- `src/app/api/conversations/route.ts` (GET Handler)

---

## Phase 2: Kunden-Bug #1 - Route-Formular Submit-Bug
**Priorität: HOCH**

### Problem
> "Eine Route einzustellen ist nur möglich, wenn man zuvor in das Kommentarfeld geklickt hat."

### Ursache
React-hook-form registriert optionale Felder nicht korrekt ohne User-Interaktion. Das `comment`-Feld blockiert den Submit.

### Lösung

**Aktionen:**
- [ ] `useForm()` mit `mode: 'onChange'` konfigurieren
- [ ] Optional: `shouldUnregister: false` für alle optionalen Felder
- [ ] Alternative: `defaultValues` komplett definieren und `register()` explizit aufrufen
- [ ] Test: Formular ohne Klick ins Kommentarfeld submitten

**Dateien:**
- `src/components/rides/create-ride-drawer.tsx` (Zeilen 269-284)
- `src/components/rides/create-ride-dialog.tsx` (falls vorhanden)

**Code-Änderung:**
```typescript
// VORHER (Zeile 269)
const form = useForm<CreateRideFormValues>({
  resolver: zodResolver(createRideSchema),
  defaultValues: { ... }
})

// NACHHER
const form = useForm<CreateRideFormValues>({
  resolver: zodResolver(createRideSchema),
  mode: 'onChange', // <- HINZUFÜGEN
  defaultValues: {
    type: 'offer',
    route: [],
    departureDate: new Date(),
    departureTime: '',
    timeFlexibility: 'flexible',
    seatsAvailable: 1,
    costSharing: '',
    comment: '', // Explizit leer
    isRecurring: false,
    recurringPattern: 'weekly',
    recurringEndDate: undefined,
  }
})
```

---

## Phase 3: Kunden-Bug #2 - Route-Benachrichtigungen (Route Watch)
**Priorität: HOCH**

### Problem
> "Feature 'Route Benachrichtigung' vollständig entwickeln, auch als Push-Benachrichtigung"

### Aktueller Stand
- Frontend UI: ✅ Funktioniert (aber nur clientseitig)
- Datenbank: ❌ Keine `route_watches` Tabelle
- Auto-Trigger: ❌ Nicht implementiert
- Push-Notifications: ❌ Nicht implementiert

### Lösung

#### 3.1 Datenbank-Migration erstellen

**Neue Datei:** `supabase/migrations/007_route_watches.sql`

```sql
-- Route Watches Tabelle
CREATE TABLE route_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Type: location (Ort + Radius) oder route (Start + Ziel)
  type TEXT NOT NULL CHECK (type IN ('location', 'route')),
  name TEXT NOT NULL,

  -- Für Location-Watches
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  radius_km INTEGER DEFAULT 25,

  -- Für Route-Watches
  start_lat DECIMAL(10, 8),
  start_lng DECIMAL(11, 8),
  start_address TEXT,
  end_lat DECIMAL(10, 8),
  end_lng DECIMAL(11, 8),
  end_address TEXT,

  -- Preferences
  ride_type TEXT DEFAULT 'both' CHECK (ride_type IN ('offer', 'request', 'both')),
  is_active BOOLEAN DEFAULT true,

  -- Push Notification Token (optional)
  push_enabled BOOLEAN DEFAULT false,

  -- Tracking
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE route_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own watches"
  ON route_watches FOR ALL
  USING (auth.uid() = user_id);

-- Index für Performance
CREATE INDEX idx_route_watches_user ON route_watches(user_id, is_active);
CREATE INDEX idx_route_watches_location ON route_watches(location_lat, location_lng)
  WHERE type = 'location';
```

#### 3.2 API-Routes erstellen

**Neue Dateien:**
- `src/app/api/route-watches/route.ts` (GET, POST)
- `src/app/api/route-watches/[id]/route.ts` (GET, PATCH, DELETE)

#### 3.3 Auto-Trigger bei Ride-Erstellung

**Änderung in:** `src/app/api/rides/route.ts` (POST Handler)

```typescript
// Nach erfolgreichem Ride-Insert:
await triggerRouteWatches(newRide)

async function triggerRouteWatches(ride: Ride) {
  // 1. Alle aktiven Watches holen (außer vom Ride-Ersteller)
  const { data: watches } = await supabase
    .from('route_watches')
    .select('*')
    .eq('is_active', true)
    .neq('user_id', ride.user_id)

  // 2. Für jeden Watch prüfen ob Match
  for (const watch of watches) {
    if (isMatch(watch, ride)) {
      // 3. In-App Notification erstellen
      await supabase.from('notifications').insert({
        user_id: watch.user_id,
        type: 'ride_match',
        title: 'Neue passende Fahrt!',
        message: `Eine Fahrt von ${ride.route[0].address} passt zu deiner Suche.`,
        data: { ride_id: ride.id, watch_id: watch.id }
      })

      // 4. Optional: Push Notification senden
      if (watch.push_enabled) {
        await sendPushNotification(watch.user_id, { ... })
      }
    }
  }
}
```

#### 3.4 Push Notifications Setup

**Neue Dateien:**
- `public/sw.js` (Service Worker)
- `public/manifest.json` (PWA Manifest)
- `src/lib/push-notifications.ts` (Push API Helper)
- `src/app/api/push/subscribe/route.ts` (Subscription speichern)
- `src/app/api/push/send/route.ts` (Push senden)

**Änderungen:**
- `src/app/layout.tsx` - Service Worker registrieren
- `src/types/database.ts` - Push Subscription Types
- `profiles` Tabelle - `push_subscription` JSONB Feld

**Aktionen:**
- [ ] VAPID Keys generieren (web-push Library)
- [ ] Service Worker implementieren
- [ ] Push Subscription Flow im Frontend
- [ ] Notification Permission Dialog
- [ ] Push Endpoint in Backend

---

## Phase 4: Kunden-Bug #3 - Intelligentes Route-Matching
**Priorität: HOCH**

### Problem
> "Route von Rheine nach Köln führt über Düsseldorf - System erkennt das nicht ohne manuelle Zwischenstopps"

### Aktueller Stand
- Nur Start/End-Matching implementiert
- `pointToSegmentDistance()` existiert, wird aber nicht genutzt
- Keine echte Route-Berechnung (nur Luftlinie)

### Lösung (3 Stufen)

#### Stufe 1: Vorhandene Funktionen nutzen (Quick Win)

**Änderung in:** `src/app/api/rides/match/route.ts`

```typescript
// VORHER: isPointOnRoute prüft nur Distanz zu Punkten
// NACHHER: Auch Distanz zu Segmenten prüfen

import { pointToSegmentDistance } from '@/lib/location-storage'

function isPointOnRouteSegments(
  point: { lat: number; lng: number },
  route: RoutePoint[],
  thresholdKm: number = 10
): boolean {
  for (let i = 0; i < route.length - 1; i++) {
    const segmentStart = route[i]
    const segmentEnd = route[i + 1]

    if (!segmentStart.lat || !segmentEnd.lat) continue

    const distance = pointToSegmentDistance(
      point,
      { lat: segmentStart.lat, lng: segmentStart.lng! },
      { lat: segmentEnd.lat, lng: segmentEnd.lng! }
    )

    if (distance <= thresholdKm) {
      return true
    }
  }
  return false
}
```

#### Stufe 2: Routing-API Integration (Optional, empfohlen)

**Optionen:**
- OpenRouteService (kostenlos, Open Source)
- Google Maps Directions API (kostenpflichtig)
- Mapbox Directions API (Freemium)

**Neue Dateien:**
- `src/lib/routing-service.ts`
- `src/app/api/routes/calculate/route.ts`

**Konzept:**
```typescript
// Beim Ride-Erstellen:
// 1. User gibt Start + End ein
// 2. Backend ruft Routing-API auf
// 3. Speichert echte Route als GeoJSON LineString
// 4. Matching prüft ob Punkt auf LineString liegt

interface RideWithRoute extends Ride {
  route_geometry?: GeoJSON.LineString  // Echte Route
  route_distance_km?: number
  route_duration_minutes?: number
}
```

#### Stufe 3: "Auf dem Weg"-Erkennung verbessern

**Änderung in:** `src/components/rides/ride-filters.tsx`

```typescript
// Filter "Unterwegs" sollte auch Rides finden,
// deren Zwischenstopps in der Nähe liegen

// Beispiel: User sucht in Düsseldorf
// → Findet Ride "Rheine → Köln" wenn Route durch Düsseldorf führt
```

**Aktionen:**
- [ ] `pointToSegmentDistance` in Match-Logik einbauen
- [ ] "Unterwegs"-Filter erweitern
- [ ] Optional: Routing-API integrieren
- [ ] UI: Zeige "Fährt durch: Düsseldorf" bei Matches

---

## Phase 5: Kunden-Bug #4 - Mobile/Responsive Fixes
**Priorität: HOCH**

### Gemeldete Probleme
> "Drawer wird teilweise abgeschnitten, kann nicht runterscrollen um auf Button zu klicken"

### Identifizierte Issues

| Issue | Komponente | Problem |
|-------|------------|---------|
| Sheet zu schmal | `sheet.tsx` | `w-3/4` auf Mobile zu eng |
| Feste Viewport-Höhe | `app-shell.tsx` | `h-[calc(100vh-3.5rem)]` problematisch |
| Keyboard überlagert Input | `conversation-view.tsx` | Keine Keyboard-Awareness |
| CreateRide Drawer | `create-ride-drawer.tsx` | Zu wenig Platz für Formular |
| Touch Targets | Diverse | < 44px Buttons |

### Lösungen

#### 5.1 Sheet/Drawer Breite korrigieren

**Datei:** `src/components/ui/sheet.tsx`

```typescript
// VORHER (Zeile 63)
"w-3/4 border-l sm:max-w-sm"

// NACHHER
"w-full sm:w-3/4 sm:max-w-md md:max-w-lg"
```

#### 5.2 CreateRideDrawer Mobile-Layout

**Datei:** `src/components/rides/create-ride-drawer.tsx`

```typescript
// VORHER (Zeile 535)
<SheetContent
  side="right"
  className="w-full sm:max-w-xl md:max-w-2xl p-0 m-4 h-[calc(100vh-2rem)] ..."
>

// NACHHER
<SheetContent
  side="right"
  className={cn(
    "w-full p-0 flex flex-col",
    // Mobile: Vollbild
    "h-full m-0 rounded-none",
    // Desktop: Floating
    "sm:m-4 sm:h-[calc(100vh-2rem)] sm:max-w-xl sm:rounded-lg",
    "md:max-w-2xl"
  )}
>
```

#### 5.3 Safe Area für Mobile Viewport

**Datei:** `src/app/layout.tsx`

```typescript
export const viewport: Viewport = {
  themeColor: [...],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // <- HINZUFÜGEN für Notch/Dynamic Island
}
```

**Datei:** `src/app/globals.css`

```css
/* Safe Areas für iOS */
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
}

/* Mobile Viewport Fix */
@supports (height: 100dvh) {
  .h-screen {
    height: 100dvh;
  }
}
```

#### 5.4 Message Input Keyboard-Awareness

**Datei:** `src/components/messages/conversation-view.tsx`

```typescript
// Keyboard Detection Hook
const [keyboardVisible, setKeyboardVisible] = useState(false)

useEffect(() => {
  if (typeof window === 'undefined') return

  const handleResize = () => {
    // iOS/Android Keyboard Detection
    const isKeyboard = window.visualViewport
      ? window.visualViewport.height < window.innerHeight * 0.75
      : false
    setKeyboardVisible(isKeyboard)
  }

  window.visualViewport?.addEventListener('resize', handleResize)
  return () => window.visualViewport?.removeEventListener('resize', handleResize)
}, [])
```

#### 5.5 Touch Targets vergrößern

**Globale Änderung in Komponenten:**

```typescript
// Alle Icon-Buttons mindestens 44x44px
<Button size="icon" className="h-11 w-11"> // statt h-9 w-9
```

**Aktionen:**
- [ ] Sheet Breite für Mobile korrigieren
- [ ] CreateRideDrawer Mobile-Layout
- [ ] Viewport-Fit und Safe Areas
- [ ] Keyboard-Awareness für Message Input
- [ ] Touch Targets auf 44px minimum
- [ ] Responsive Padding (`px-3 sm:px-4`)
- [ ] Test auf iPhone SE, iPhone 14 Pro, Android

---

## Phase 6: Freundschaftssystem entfernen
**Priorität: MITTEL**

### Kundenanforderung
> "Die Funktion, dass Fahrer sich außerhalb der Fahrt connecten können, ist ausdrücklich nicht erwünscht."

### Zu löschende Dateien (komplett)

```
src/app/(authenticated)/connections/page.tsx
src/app/api/connections/route.ts
src/app/api/connections/check/route.ts
src/app/api/connections/[id]/route.ts
src/components/connections/connection-button.tsx
src/components/connections/connections-list.tsx
src/components/connections/index.ts
src/components/profile/profile-connection-button.tsx
supabase/migrations/005_connections_table.sql
```

### Zu ändernde Dateien

#### 6.1 Types bereinigen
**Datei:** `src/types/database.ts`
- Entfernen: `connections` Table Definition (Zeilen 325-350)
- Entfernen: `ConnectionStatus` Type
- Entfernen: `connection_request` aus NotificationType
- Entfernen: Connection-related Types

#### 6.2 Sidebar Navigation
**Datei:** `src/components/layout/sidebar.tsx`
- Entfernen: `Users` Icon Import
- Entfernen: "Verbindungen" Navigation Item

#### 6.3 Public Profile Page
**Datei:** `src/app/u/[username]/page.tsx`
- Entfernen: `ProfileConnectionButton` Import
- Entfernen: Connection Button Rendering

#### 6.4 Notifications
**Datei:** `src/components/notifications/notifications-dropdown.tsx`
- Entfernen: `Users` Icon Import
- Entfernen: `connection_request` Icon Mapping

**Datei:** `src/components/settings/notifications-tab.tsx`
- Entfernen: `connection_request` Preference

#### 6.5 Datenbank
- Migration erstellen: `DROP TABLE IF EXISTS connections;`
- Oder: Tabelle manuell in Supabase löschen

**Aktionen:**
- [ ] Alle oben genannten Dateien löschen
- [ ] Alle oben genannten Änderungen durchführen
- [ ] TypeScript Errors beheben
- [ ] `connections` Tabelle aus Supabase entfernen
- [ ] Test: Keine Referenzen mehr auf Connections

---

## Phase 7: Code-Qualität & Wartbarkeit
**Priorität: MITTEL**

### 7.1 Zod-Validation für API-Responses

**Problem:** Überall `as` Type-Assertions ohne echte Validierung

**Lösung:**
```typescript
// Neue Datei: src/lib/schemas.ts
import { z } from 'zod'

export const profileSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email().nullable(),
  // ...
})

// In API Routes:
const profile = profileSchema.parse(data)
```

### 7.2 Error-Handling standardisieren

**Neue Datei:** `src/lib/api-error.ts`

```typescript
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
  }
}

export function handleAPIError(error: unknown): NextResponse {
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }
  console.error('Unhandled error:', error)
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  )
}
```

### 7.3 Middleware verbessern

**Datei:** `src/middleware.ts`
- `.maybeSingle()` statt `.single()` verwenden
- Explizite Error-Code Prüfung

**Aktionen:**
- [ ] Zod-Schemas für alle DB-Responses
- [ ] Einheitliches Error-Handling
- [ ] Middleware Error-Handling verbessern
- [ ] Console.error durch strukturiertes Logging ersetzen

---

## Phase 8: Dokumentation & Tests
**Priorität: NIEDRIG (aber wichtig)**

### 8.1 README aktualisieren
- Setup-Anleitung
- Environment Variables Dokumentation
- Deployment-Guide

### 8.2 API-Dokumentation
- OpenAPI/Swagger Spec erstellen
- Endpoint-Dokumentation

### 8.3 Tests hinzufügen
- Unit Tests für kritische Funktionen
- Integration Tests für API-Routes
- E2E Tests für kritische Flows (Vitest + Playwright)

---

## Zusammenfassung: Priorisierte Reihenfolge

### Woche 1: Kritisch
1. ✅ Phase 1: Sicherheit (Secrets, Race Conditions)
2. ✅ Phase 2: Bug #1 (Formular Submit)
3. ✅ Phase 5: Bug #4 (Mobile/Responsive)

### Woche 2: Hoch
4. ✅ Phase 3: Bug #2 (Route Watch - Basis)
5. ✅ Phase 4: Bug #3 (Route Matching)
6. ✅ Phase 6: Connections entfernen

### Woche 3: Mittel
7. ✅ Phase 3: Bug #2 (Push Notifications)
8. ✅ Phase 7: Code-Qualität

### Fortlaufend
9. ✅ Phase 8: Dokumentation & Tests

---

## Notizen für Entwicklung

### Git-Workflow
- Für jede Phase einen Feature-Branch erstellen
- PRs mit beschreibenden Commit-Messages
- Keine direkten Pushes auf `main`

### Testing-Strategie
- Jede Änderung lokal testen
- Mobile Testing auf echten Geräten (iOS Safari, Android Chrome)
- Supabase Edge Functions lokal testen mit `supabase functions serve`

### Deployment
- Vercel Preview Deployments für jeden PR
- Production Deployment nur nach Code Review
- Secrets in Vercel Environment Variables

---

*Dieser Plan wurde basierend auf einer vollständigen Code-Analyse und den Kunden-Bug-Reports erstellt.*
