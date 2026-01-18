# Carcashflow - Änderungsprotokoll 18. Januar 2026

## Zusammenfassung

Alle 8 Phasen des Implementierungsplans wurden erfolgreich abgeschlossen.

---

## Phase 1: Kritische Sicherheit & Stabilität ✅

### 1.1 Environment Variables
- Verifiziert: `.env.local` ist bereits in `.gitignore`
- Keine Secrets im Repository gefunden

### 1.2 Race Condition bei Conversations
**Datei:** `src/app/api/conversations/route.ts`
- Normalisierte Teilnehmer-Reihenfolge implementiert (`[participant1, participant2].sort()`)
- Handling für Unique Constraint Violation (Error Code 23505)
- Bei Race Condition wird bestehende Conversation zurückgegeben

### 1.3 Recurring Rides Rollback
**Datei:** `src/app/api/rides/route.ts`
- Rollback-Logik implementiert: Bei Fehler bei Child-Rides wird Parent-Ride gelöscht
- Klares Error-Feedback an User

### 1.4 N+1 Queries eliminiert
**Datei:** `src/app/api/conversations/route.ts`
- JOIN-Query für Messages statt einzelner Queries
- Performance-Optimierung für 50+ Conversations

---

## Phase 2: Bug #1 - Route-Formular Submit ✅

### Problem
Route erstellen nur möglich nach Klick ins Kommentarfeld

### Lösung
**Dateien:**
- `src/components/rides/create-ride-drawer.tsx`
- `src/components/rides/edit-ride-dialog.tsx`

**Änderung:**
```typescript
const form = useForm<CreateRideFormValues>({
  resolver: zodResolver(createRideSchema),
  mode: "onChange", // <- NEU
  defaultValues: { ... }
})
```

---

## Phase 3: Bug #2 - Route-Benachrichtigungen ✅

### Neue Dateien
- `supabase/migrations/011_route_watches.sql` - Datenbank-Tabelle mit RLS
- `src/app/api/route-watches/route.ts` - GET, POST
- `src/app/api/route-watches/[id]/route.ts` - GET, PATCH, DELETE
- `src/app/api/route-watches/trigger/route.ts` - Trigger bei neuen Rides

### Änderungen
- `src/app/api/rides/route.ts` - Ruft Trigger-Endpoint nach Ride-Erstellung
- `src/components/rides/route-watch-manager.tsx` - Komplett neu geschrieben für Server-API

### Features
- Location-Watches (Ort + Radius)
- Route-Watches (Start + Ziel)
- Automatische In-App Benachrichtigungen bei neuen passenden Fahrten
- Max. 10 Watches pro User

---

## Phase 4: Bug #3 - Intelligentes Route-Matching ✅

### Problem
Route Rheine → Köln erkennt Düsseldorf nicht als "auf dem Weg"

### Lösung
**Datei:** `src/app/api/rides/match/route.ts`

Neue Funktionen:
- `pointToSegmentDistance()` - Perpendicular distance zu Routensegmenten
- `isPointInCorridor()` - Erkennt ob Punkt im "Korridor" zwischen Start/Ende liegt
- Verbessertes `isPointOnRoute()` - Nutzt Segment-Distanz statt nur Punkt-Distanz

### Algorithmus
1. Prüft ob Ride-Start/End auf User-Route liegt (Segment-Distanz)
2. Prüft ob User-Start/End auf Ride-Route liegt
3. Prüft Zwischenstopps im Korridor (max. 20% Umweg oder 30km)
4. Gibt `matchDetails` mit Erklärung zurück ("Fährt über Düsseldorf")

---

## Phase 5: Bug #4 - Mobile/Responsive Fixes ✅

### Änderungen

**`src/components/ui/sheet.tsx`:**
- Mobile: `w-full` (vorher: `w-3/4`)
- Desktop: `sm:w-3/4 sm:max-w-md`

**`src/components/rides/create-ride-drawer.tsx`:**
- Mobile-first Layout mit `h-full m-0 rounded-none border-0`
- Desktop: `sm:m-4 sm:h-[calc(100vh-2rem)] sm:rounded-lg`

**`src/app/layout.tsx`:**
- `viewportFit: "cover"` für Notch/Dynamic Island
- `maximumScale: 1` verhindert ungewolltes Zoomen

**`src/app/globals.css`:**
- Safe Area CSS-Variablen für iOS
- `100dvh` Support für mobile Browser
- Touch-friendly Input-Größen (16px verhindert iOS-Zoom)
- Min-height 44px für Touch-Targets

**`src/components/ui/dialog.tsx`:**
- Mobile: Bottom-Sheet Style
- Desktop: Centered Modal

---

## Phase 6: Freundschaftssystem entfernen ✅

### Gelöschte Dateien
- `src/app/(authenticated)/connections/page.tsx`
- `src/app/api/connections/route.ts`
- `src/app/api/connections/check/route.ts`
- `src/app/api/connections/[id]/route.ts`
- `src/components/connections/connection-button.tsx`
- `src/components/connections/connections-list.tsx`
- `src/components/profile/profile-connection-button.tsx`
- `src/components/profile/index.ts`

### Geänderte Dateien
- `src/components/layout/sidebar.tsx` - "Verbindungen" entfernt
- `src/app/u/[username]/page.tsx` - Connection-Button entfernt
- `src/components/notifications/notifications-dropdown.tsx` - connection_request entfernt
- `src/components/settings/notifications-tab.tsx` - Verbindungsanfragen entfernt
- `src/types/database.ts` - Connection-Types entfernt

### Neue Migration
- `supabase/migrations/012_drop_connections_table.sql`

---

## Phase 7: Code-Qualität & Wartbarkeit ✅

### ESLint Fehler behoben
- Alle 13 Errors zu 0 Errors reduziert
- 30 Warnings verbleiben (akzeptabel für MVP)

### Fixes
- Unescaped Entities in JSX (`'` → `&apos;`, `"` → `&ldquo;/&rdquo;`)
- Unused imports entfernt (Mail, Users, etc.)
- `let` zu `const` wo möglich
- Empty interface zu `type` konvertiert
- `useSyncExternalStore` für SSR-safe mounting detection

### Dateien
- `src/app/(auth)/login/login-form.tsx`
- `src/app/(authenticated)/changelog/page.tsx`
- `src/app/(authenticated)/design-system/page.tsx`
- `src/app/(authenticated)/profile/page.tsx`
- `src/app/(authenticated)/settings/page.tsx`
- `src/app/(authenticated)/rides/[id]/page.tsx`
- `src/app/page.tsx`
- `src/components/map/route-map.tsx`
- `src/components/promo/testimonial-card.tsx`
- `src/components/rides/create-ride-dialog.tsx`
- `src/components/rides/create-ride-drawer.tsx`
- `src/components/rides/ride-card.tsx`
- `src/components/rides/ride-filters.tsx`
- `src/components/ui/password-input.tsx`
- `src/app/api/rides/match/route.ts`
- `src/app/api/route-watches/[id]/route.ts`
- `src/app/api/route-watches/trigger/route.ts`

---

## Phase 8: Dokumentation ✅

### Erstellt
- `CHANGELOG_2026-01-18.md` (diese Datei)

### Verifiziert
- `npm run build` - Erfolgreich
- `npm run lint` - 0 Errors, 30 Warnings
- TypeScript - Keine Kompilierungsfehler

---

## Deployment-Hinweise

### Datenbank-Migrationen ausführen
```bash
# In Supabase Dashboard oder CLI:
supabase db push
```

Neue Migrationen:
1. `011_route_watches.sql` - Route Watch Tabelle
2. `012_drop_connections_table.sql` - Connections Tabelle löschen

### Nach Deployment testen
1. Route erstellen ohne Kommentarfeld anzuklicken
2. Route Watch erstellen und neuen Ride posten → Notification prüfen
3. Route "Rheine → Köln" erstellen, Suche nach "Düsseldorf" → sollte matchen
4. Mobile: Drawer/Sheet Darstellung auf iPhone testen
5. Sidebar: "Verbindungen" sollte nicht mehr erscheinen

---

*Implementierung abgeschlossen am 18. Januar 2026*
