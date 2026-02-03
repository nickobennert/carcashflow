# Changelog - Entwicklungssession

**Projekt:** Fahr mit! (Carcashflow)
**Zeitraum:** Diese Session
**Entwickler:** Claude Opus 4.5

---

## Übersicht

Diese Session umfasste eine umfangreiche Analyse des bestehenden Codes, die Implementierung eines vollständigen Routen-Systems mit echten Straßenberechnungen, Bugfixes basierend auf Kundenfeedback, sowie Mobile-Optimierungen.

---

## 1. Routen-System (Hauptfeature)

### 1.1 OSRM Integration - Echte Straßen-Routing

**Datei:** `src/lib/routing/osrm.ts`

Das Herzstück der App: Statt Luftlinie werden jetzt echte Straßenrouten berechnet.

**Routing Service:**
- **OSRM** (Open Source Routing Machine) - kostenlos, kein API-Key erforderlich
- Demo-Server: `https://router.project-osrm.org`
- Für Produktion: Self-Hosting empfohlen

**Kern-Funktionen:**

| Funktion | Beschreibung |
|----------|--------------|
| `calculateRoute(points)` | Berechnet Route zwischen 2+ Punkten |
| `decodePolyline()` | Dekodiert Google Polyline Format |
| `getInstruction()` | Übersetzt Manöver zu deutschen Anweisungen |
| `isPointNearRoute()` | Prüft ob ein Punkt auf einer Route liegt |
| `formatDistance()` | Formatiert Meter zu "12,5 km" |
| `formatDuration()` | Formatiert Sekunden zu "1 Std. 23 Min." |

**RoutePoint Interface:**
```typescript
interface RoutePoint {
  type: "start" | "stop" | "end"  // Art des Halts
  address: string                  // Straßenadresse
  lat: number                      // Breitengrad
  lng: number                      // Längengrad
  order: number                    // Reihenfolge
}
```

**RouteResult Interface:**
```typescript
interface RouteResult {
  distance: number                  // Gesamtdistanz in Metern
  duration: number                  // Fahrzeit in Sekunden
  geometry: [number, number][]      // Koordinaten für Kartenansicht
  steps: RouteStep[]                // Turn-by-Turn Anweisungen (Deutsch)
  waypoints: { name, location }[]   // Berechnete Zwischenpunkte
}
```

---

### 1.2 Matching-System - Intelligente Fahrtsuche

**Datei:** `src/app/api/rides/match/route.ts`

Das "Düsseldorf liegt auf dem Weg"-Problem gelöst!

**Problem:**
- User fährt von **Rheine → Köln**
- Rider fährt **Düsseldorf → München**
- Düsseldorf liegt auf der Strecke Rheine → Köln
- Klassisches Matching scheitert, weil Start/End nicht übereinstimmen

**Lösung: Segment-basierte Distanz-Berechnung**

```
isPointOnRoute(point, route, thresholdKm = 20)
  ├─ Iteriert über alle Route-Segmente
  ├─ Berechnet perpendicular distance zum Weg
  └─ Rückgabe: {onRoute: boolean, minDistance: number}
```

**Matching-Algorithmus:**

```
FÜR JEDE FAHRT IN DER DATENBANK:

1. Berechne Route-Ähnlichkeit (0-100)
   └─ Basierend auf Start/End Nähe
   └─ 0km = 100 Punkte, 50km = 50 Punkte, 100km+ = 0 Punkte

2. Prüfe 4 Szenarien:
   a) Ist Fahrt-Start auf meiner Route?
   b) Ist Fahrt-Ende auf meiner Route?
   c) Ist mein Start auf der Fahrt-Route?
   d) Ist mein Ziel auf der Fahrt-Route?

3. Corridor Detection (für Zwischenstopps)
   └─ Umweg <= 20% oder thresholdKm
   └─ Stopps im "Korridor" werden erkannt

4. Score & Sortierung
   └─ onTheWay > similarity > minDistance
```

**Beispiel Match-Details:**
```json
{
  "onTheWay": true,
  "similarity": 35,
  "matchDetails": [
    "Start liegt auf deiner Route (12 km)",
    "Fährt über Düsseldorf",
    "Dein Ziel liegt auf dieser Route (8 km)"
  ],
  "minDistance": 8
}
```

---

### 1.3 Route Watches - Benachrichtigungen bei neuen Fahrten

**Dateien:**
- `src/app/api/route-watches/route.ts` (CRUD)
- `src/app/api/route-watches/trigger/route.ts` (Matching)
- `src/components/rides/route-watch-manager.tsx` (UI)

User können "warten" auf passende Fahrten und werden benachrichtigt.

**Zwei Watch-Typen:**

**A) Location Watch (Punkt + Radius)**
```typescript
{
  type: "location",
  name: "Düsseldorf Umkreis",
  lat: 51.225, lng: 6.77,
  address: "Düsseldorf, Deutschland",
  radius_km: 25,
  ride_type: "offer" | "request" | "both"
}
```

**B) Route Watch (Start + Ende)**
```typescript
{
  type: "route",
  name: "Rheine nach Köln",
  start_lat: 52.2, start_lng: 7.4, start_address: "Rheine",
  end_lat: 50.93, end_lng: 6.96, end_address: "Köln",
  ride_type: "offer"
}
```

**Trigger-Flow bei neuer Fahrt:**
```
1. Neue Fahrt erstellt → POST /api/route-watches/trigger
2. Backend prüft ALLE Watches anderer User
3. Bei Match → Notification erstellen
4. Watcher bekommt Push: "Neue passende Fahrt!"
```

---

### 1.4 Route-Builder (Frontend)

**Datei:** `src/components/rides/create-ride-drawer.tsx`

Benutzerfreundlicher Builder für Routen-Erstellung.

**Features:**

| Feature | Beschreibung |
|---------|--------------|
| **Drag & Drop** | Zwischenstopps per Drag verschieben |
| **Location Search** | Nominatim API für Adresssuche |
| **Karten-Klick** | Punkt setzen durch Kartenklick |
| **Route Visualisierung** | Leaflet Map mit berechneter Route |
| **Distance/Duration** | Automatische Berechnung via OSRM |
| **Favoriten** | Häufige Routen speichern & laden |
| **Live-Matching** | Zeigt passende Fahrten während Eingabe |

**Recurring Rides (Wiederkehrende Fahrten):**
- Wochentage auswählen (Mo-So)
- Dauer wählen (1-12 Wochen)
- Automatische Erstellung: z.B. "4 Tage × 4 Wochen = 16 Fahrten"
- Max. 52 Fahrten (1 Jahr)

---

### 1.5 Distanz-Berechnungen

**Haversine Formula (überall verwendet):**
```typescript
// Berechnet Distanz zwischen zwei Koordinaten
const R = 6371 // Erdradius in km
const dLat = (lat2 - lat1) * (π/180)
const dLng = (lng2 - lng1) * (π/180)
const a = sin(dLat/2)² + cos(lat1) * cos(lat2) * sin(dLng/2)²
const c = 2 * atan2(√a, √(1-a))
return R * c  // Distanz in km
```

**Similarity Score:**
```typescript
// Wie ähnlich sind zwei Routen?
startScore = MAX(0, 100 - startDistance * 2)
endScore = MAX(0, 100 - endDistance * 2)
similarity = (startScore + endScore) / 2

// Beispiel:
// Start 5km entfernt, Ende 10km entfernt
// = (90 + 80) / 2 = 85% Ähnlichkeit
```

---

### 1.6 Routen-System Dateien

| Datei | Zweck |
|-------|-------|
| `src/lib/routing/osrm.ts` | OSRM Routing Engine |
| `src/lib/routing/index.ts` | Re-Export |
| `src/lib/location-storage.ts` | Favoriten, Watches, Distanzen |
| `src/components/map/route-map.tsx` | Leaflet Map mit Route |
| `src/components/map/location-search.tsx` | Ortssuche & Geocoding |
| `src/components/rides/create-ride-drawer.tsx` | Route-Builder UI |
| `src/components/rides/matching-rides.tsx` | Passende Fahrten anzeigen |
| `src/components/rides/route-watch-manager.tsx` | Watch-Verwaltung UI |
| `src/app/api/rides/route.ts` | Fahrt CRUD |
| `src/app/api/rides/match/route.ts` | **Matching Engine** |
| `src/app/api/route-watches/route.ts` | Watch CRUD |
| `src/app/api/route-watches/trigger/route.ts` | Notification Trigger |

---

## 2. Initiale Code-Analyse

### Durchgeführte Analyse
- Vollständige Durchsicht der Projektstruktur
- Review aller `.md` Dokumentationsdateien (CLAUDE.md, README.md)
- Analyse der Datenbankstruktur und API-Endpunkte
- Überprüfung der Authentifizierung und Subscription-Logik

### Identifizierte Verbesserungspotenziale
- Mobile UI-Optimierungen erforderlich
- Einige Komponenten mit redundantem Code
- Overflow-Probleme auf verschiedenen Seiten

---

## 3. Bugfixes (Kundenfeedback)

### 3.1 Mobile Dialoge & Modals
**Problem:** Modals wurden am unteren Bildschirmrand angezeigt statt zentriert.

**Lösung:**
- Alle Modals werden jetzt mittig zentriert
- Close-Button immer sichtbar mit Hintergrund-Blur
- Responsive Padding (kleiner auf Mobile, größer auf Desktop)

**Betroffene Dateien:** `src/components/ui/dialog.tsx`

---

### 3.2 Abo-Auswahl Modal
**Problem:** Modal war zu klein und unübersichtlich.

**Lösung:**
- Deutlich größer auf Desktop (max-w-5xl)
- Responsive Breite für alle Bildschirmgrößen
- Animierter Gold/Pink Gradient-Rahmen für Premium-Plan

**Betroffene Dateien:** `src/components/subscription/subscription-modal.tsx`

---

### 3.3 Einstellungen - Mobile Navigation
**Problem:** Tabs nahmen zu viel Platz auf Mobile ein.

**Lösung:**
- Tabs werden auf Mobile als 6-spaltiges Icon-Grid angezeigt
- Labels erscheinen nur auf Desktop
- Platzsparend und übersichtlich

**Betroffene Dateien:** `src/app/(authenticated)/settings/page.tsx`

---

### 3.4 Admin-Bereich - Nutzer-Tabelle
**Problem:** Tabelle lief horizontal über den Bildschirmrand hinaus.

**Lösung (Final):**
- Komplett neue Mobile-Kartenansicht (`md:hidden`) statt Tabelle
- Jeder Nutzer wird als kompakte Karte mit allen Infos dargestellt
- Tabelle nur noch auf Desktop (`hidden md:block`)
- Cards mit `truncate`, `min-w-0`, `shrink-0` für korrekte Textumbrüche

**Betroffene Dateien:** `src/components/admin/users-table.tsx`

---

### 3.5 Benachrichtigungs-Dropdown
**Problem:** Dropdown schloss nicht beim Öffnen des "Alle Benachrichtigungen" Dialogs.

**Lösung:**
- Dropdown schließt jetzt automatisch beim Öffnen des Dialogs
- Responsive Breite für Mobile

**Betroffene Dateien:** `src/components/layout/header.tsx`

---

### 3.6 Routen-Detailseite
**Problem:** Nicht für Mobile optimiert, enthielt veraltete Links.

**Lösung:**
- Vollständig für Mobile optimiert
- Responsive Typography (kleinere Überschriften auf Mobile)
- Info-Grid: 1 Spalte auf Mobile, 3 Spalten auf Desktop
- Route-Timeline: Kompaktere Abstände auf Mobile
- **Entfernt:** Link zum öffentlichen Profil (Freundschaftssystem-Überbleibsel)
- **Entfernt:** "Profil anzeigen" aus Dropdown-Menü
- **Geändert:** Hinweistext zu "Schreibe eine Nachricht um Kontakt aufzunehmen"

**Betroffene Dateien:** `src/app/(authenticated)/rides/[id]/page.tsx`

---

### 3.7 Chat/Messages - Horizontales Scrolling
**Problem:** Man konnte horizontal scrollen im Chat auf Mobile.

**Lösung:**
- Root-Container: `overflow-hidden` hinzugefügt
- Messages-Area: `overflow-x-hidden` hinzugefügt
- Ride-Context-Banner: `overflow-hidden`, `min-w-0` für truncate
- Datum im Banner verkürzt (`dd.MM.` statt `dd.MM.yyyy`)
- Alle flex-children mit `min-w-0` und `shrink-0` versehen

**Betroffene Dateien:** `src/components/messages/conversation-view.tsx`

---

### 3.8 Chat Header
**Problem:** Doppelte Back-Buttons, Header nicht optimal auf Mobile.

**Lösung:**
- Doppelten Back-Button zu einem konsolidiert
- Responsive Gaps: `gap-2 sm:gap-3`
- Responsive Padding: `px-3 sm:px-4`
- Avatar kleiner auf Mobile: `h-9 w-9 sm:h-10 sm:w-10`
- Online-Indikator kleiner auf Mobile: `h-2.5 w-2.5 sm:h-3 sm:w-3`

**Betroffene Dateien:** `src/components/messages/conversation-view.tsx`

---

### 3.9 Message Bubbles
**Problem:** Bubbles konnten zu breit werden auf kleinen Screens.

**Lösung:**
- Max-width angepasst: `max-w-[80%] sm:max-w-[65%]` (vorher 75%)
- `overflow-hidden` auf Text-Paragraph
- Check-Icons mit `shrink-0`

**Betroffene Dateien:** `src/components/messages/conversation-view.tsx`

---

### 3.10 Message Input
**Problem:** Potentielles Overflow-Problem.

**Lösung:**
- `min-w-0` für das Textarea um Flex-Overflow zu verhindern
- Responsive Padding: `px-3 sm:px-4`

**Betroffene Dateien:** `src/components/messages/message-input.tsx`

---

### 3.11 AppShell Layout
**Problem:** Horizontales Scrolling auf verschiedenen Seiten möglich.

**Lösung:**
- `min-w-0 overflow-hidden` auf main-Element
- `overflow-x-hidden` auf Standard-Content-Wrapper

**Betroffene Dateien:** `src/components/layout/app-shell.tsx`

---

### 3.12 Mobile Sidebar
**Problem:** Überlappung mit Close-Button.

**Lösung:**
- Padding oben (pt-12) um Überlappung zu vermeiden
- Schließt automatisch bei Navigation

**Betroffene Dateien:** `src/components/layout/sidebar.tsx`

---

## 4. Entfernte Features

### 4.1 Datenexport - Excel Option
**Grund:** War redundant mit CSV.

**Änderung:** Nur noch JSON und CSV als Export-Formate.

**Betroffene Dateien:** `src/app/(authenticated)/settings/page.tsx`

---

## 5. Technische Verbesserungen

### 5.1 Konsistente CSS-Patterns
- Konsistente responsive Breakpoints (`sm:` für ≥640px)
- `shrink-0` für Icons um Stauchung zu verhindern
- `min-w-0` für Flex-Children um Text-Overflow zu ermöglichen
- `truncate` und `line-clamp-2` für lange Texte

### 5.2 Performance
- Redundante DOM-Elemente entfernt (doppelte Buttons)
- Weniger CSS-Klassen durch Konsolidierung

---

## 6. Git Commits

| Commit | Beschreibung |
|--------|--------------|
| `c85accb` | fix: mobile UI for admin table and chat view |
| `3df07e8` | fix: admin tables horizontal scroll on mobile |
| `1d4fec7` | fix: comprehensive mobile UI overhaul |
| `7fa17fb` | fix: mobile UI fixes for dialogs, notifications, and settings |
| `b01070e` | fix: mobile UI improvements |
| `521564c` | style: UI improvements and mobile fixes |
| `a06aada` | feat: OSRM Integration - Echte Road-Routing |
| `a3332da` | feat: Route Watches - User können auf Routen "warten" |
| `c1cddaf` | fix: Infinite Loop - Routing Calculation behoben |
| `b1ffb7c` | fix: Routing Loop & Counter - Dashboard Counter Fix |
| `72b631b` | fix: Optional route_geometry - Spalten-Fehler isoliert |
| `2eb76d8` | fix: Simplify ride creation - Weniger Fehler |
| `4da16a0` | fix: Disable route_geometry - 22P02 Error (temporär) |

---

## 7. Betroffene Dateien (Zusammenfassung)

### Routen-System
- `src/lib/routing/osrm.ts`
- `src/lib/routing/index.ts`
- `src/lib/location-storage.ts`
- `src/components/map/route-map.tsx`
- `src/components/map/location-search.tsx`
- `src/components/rides/create-ride-drawer.tsx`
- `src/components/rides/matching-rides.tsx`
- `src/components/rides/route-watch-manager.tsx`
- `src/app/api/rides/route.ts`
- `src/app/api/rides/match/route.ts`
- `src/app/api/route-watches/route.ts`
- `src/app/api/route-watches/trigger/route.ts`

### UI-Komponenten
- `src/components/admin/users-table.tsx`
- `src/components/layout/app-shell.tsx`
- `src/components/layout/header.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/messages/conversation-view.tsx`
- `src/components/messages/message-input.tsx`
- `src/components/subscription/subscription-modal.tsx`
- `src/components/ui/dialog.tsx`

### Seiten
- `src/app/(authenticated)/settings/page.tsx`
- `src/app/(authenticated)/rides/[id]/page.tsx`

---

## 8. Bekannte Einschränkungen

### 8.1 Route Geometry (temporär deaktiviert)
- **Status:** `route_geometry`, `route_distance`, `route_duration` Spalten sind deaktiviert
- **Grund:** PostgreSQL 22P02 Fehler bei Column-Type
- **Auswirkung:** Keine, Routen werden trotzdem berechnet und angezeigt
- **Fix:** Datenmigration erforderlich, wenn Spalten wieder aktiviert werden sollen

### 8.2 OSRM Demo Server
- **Status:** Nutzt öffentlichen Demo-Server
- **Einschränkung:** Rate-Limited
- **Empfehlung für Produktion:** Self-Hosting oder alternativer Provider

---

## 9. Offene Punkte / Nächste Schritte

### Vor Go-Live zu erledigen
1. **Stripe Integration** - Produktiv-Keys einrichten
2. **E-Mail-Templates** - Transaktionale E-Mails konfigurieren
3. **Rechtliches** - AGB, Datenschutz finalisieren
4. **Testing** - End-to-End Tests durchführen
5. **Monitoring** - Error-Tracking einrichten (z.B. Sentry)
6. **OSRM** - Self-Hosting für Produktion evaluieren

### Kostenlose vs. Premium Version
- Dokumentation der Feature-Unterschiede erforderlich
- Paywall-Logik verifizieren

---

*Erstellt am: Session-Ende*
*Entwickelt mit Claude Opus 4.5*
