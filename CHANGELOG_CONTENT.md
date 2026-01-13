# Changelog Tracking

Diese Datei dient als Referenz für alle Changelog-Einträge.
Bei neuen Features, Fixes oder Verbesserungen MUSS hier ein Eintrag erstellt werden.

## Format für Einträge

```typescript
{
  id: "unique-id",
  date: new Date("YYYY-MM-DD"),
  title: "Kurzer Titel",
  description: "Ausführliche Beschreibung",
  type: "feature" | "improvement" | "fix",
  highlights: ["Punkt 1", "Punkt 2"] // Optional
}
```

---

## Aktuelle Einträge (für changelog/page.tsx)

### Januar 2026

#### 13.01.2026 - UI & Navigation Verbesserungen
- **Type:** improvement
- **Highlights:**
  - Sidebar komplett überarbeitet (collapsible, neues Design)
  - Layout-Scrolling optimiert (kein doppeltes Scrollen mehr)
  - Hilfe-Seite neu strukturiert mit Tabs
  - Tooltips für bessere UX

#### 13.01.2026 - Phase 2 Features
- **Type:** feature
- **Highlights:**
  - Verbindungssystem (Freundschaften)
  - Meldefunktion für Nutzer
  - Admin-Dashboard
  - Promo-Code System

#### XX.XX.2026 - Erste Veröffentlichung
- **Type:** feature
- **Highlights:**
  - Mitfahrbörse mit Routen-Erstellung
  - Nachrichtensystem
  - Profil-Management
  - Subscription-System

---

## Checkliste bei neuen Releases

- [ ] Changelog-Eintrag in dieser Datei erstellen
- [ ] Eintrag in `/app/(authenticated)/changelog/page.tsx` übertragen
- [ ] Hilfe-Seite aktualisieren (HELP_CONTENT.md)
- [ ] Version in Sidebar aktualisieren (falls Major-Release)

---

## Kategorien

| Type | Verwendung | Badge-Farbe |
|------|------------|-------------|
| feature | Neue Funktionalität | Grün |
| improvement | Verbesserung bestehender Features | Blau |
| fix | Bugfixes | Rot/Orange |

---

## Versionierung

Aktuell: **BETA 1.0**

- BETA = Noch in Entwicklung, Feature-Changes möglich
- 1.x = Minor Updates, neue Features
- x.0 = Major Release, Breaking Changes

---

## Ausstehende Changelog-Einträge

Folgende Features benötigen noch Changelog-Einträge wenn fertig:

- [ ] Benachrichtigungen (In-App vollständig)
- [ ] E-Mail-Benachrichtigungen
- [ ] Geräte-Verwaltung
- [ ] Sprach-Einstellungen
- [ ] Sicherheits-Tab in Settings
- [ ] Digistore24/Payment Integration
