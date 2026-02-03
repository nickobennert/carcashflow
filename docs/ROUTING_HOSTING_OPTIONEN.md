# Carcashflow - Routing-Infrastruktur
## Technische Dokumentation für Entscheidungsträger

---

## Zusammenfassung

Die Carcashflow-Plattform verwendet ein intelligentes Routensystem zur Berechnung von Fahrtstrecken und zur Ermittlung passender Mitfahrgelegenheiten. Dieses Dokument erklärt die technischen Optionen und deren Kosten.

---

## Aktueller Stand

**Status:** Entwicklungsphase mit Demo-Server

Die Anwendung nutzt derzeit den öffentlichen OSRM-Demo-Server für Routenberechnungen. Dieser ist:
- Kostenlos nutzbar
- Für Entwicklung und Tests geeignet
- **Nicht für Produktivbetrieb zugelassen** (laut OSRM-Nutzungsbedingungen)

---

## Was ist OSRM?

**OSRM (Open Source Routing Machine)** ist eine quelloffene Software zur Berechnung von Fahrtrouten. Sie verwendet OpenStreetMap-Kartendaten und berechnet:

- Kürzeste/schnellste Route zwischen zwei Punkten
- Fahrzeit und Distanz
- Wegpunkte entlang der Strecke

**Wichtig:** OSRM selbst ist kostenlos. Die Kosten entstehen durch den Server, auf dem OSRM betrieben wird.

---

## Hosting-Optionen

### Option 1: Self-Hosting (Empfohlen)

Ein eigener Server wird angemietet und OSRM darauf installiert.

| Aspekt | Details |
|--------|---------|
| **Anbieter** | Hetzner, DigitalOcean, AWS, oder ähnliche |
| **Server-Typ** | VPS (Virtual Private Server) |
| **Empfohlene Specs** | 4 GB RAM, 2 CPU Cores, 50 GB SSD |
| **Monatliche Kosten** | **€10 - €30** |
| **Kartendaten** | Deutschland/DACH-Region (~2-4 GB) |

**Vorteile:**
- Vollständige Kontrolle
- Keine Anfragelimits
- Schnelle Antwortzeiten
- DSGVO-konform (Server in Deutschland möglich)
- Vorhersehbare, fixe Kosten

**Einrichtung:**
- Einmalig ca. 2-4 Stunden Konfiguration
- Kartendaten-Update: Monatlich empfohlen (automatisierbar)

---

### Option 2: Managed Services

Externe Anbieter betreiben die Routing-Infrastruktur.

| Anbieter | Kosten | Bemerkung |
|----------|--------|-----------|
| **OpenRouteService** | Kostenlos bis 2.000 Anfragen/Tag | Deutsches Unternehmen, DSGVO-konform |
| **MapBox Directions** | ~€0,50 pro 1.000 Anfragen | US-Anbieter, sehr schnell |
| **Google Routes API** | ~€5 pro 1.000 Anfragen | Teuer, aber zuverlässig |
| **HERE Routing** | ~€1 pro 1.000 Anfragen | Enterprise-Qualität |

**Kostenbeispiel bei 10.000 Anfragen/Monat:**
- OpenRouteService: €0 (im Free-Tier)
- MapBox: ~€5/Monat
- Google: ~€50/Monat

---

## Kostenvergleich

| Szenario | Self-Hosting | OpenRouteService | MapBox |
|----------|--------------|------------------|--------|
| **1.000 Anfragen/Monat** | €15 fix | €0 | €0,50 |
| **10.000 Anfragen/Monat** | €15 fix | €0 | €5 |
| **50.000 Anfragen/Monat** | €20 fix | €30+ | €25 |
| **100.000+ Anfragen/Monat** | €30 fix | Nicht verfügbar | €50+ |

**Fazit:** Bei wachsender Nutzung ist Self-Hosting langfristig günstiger.

---

## Empfehlung

### Phase 1: MVP / Soft Launch
**OpenRouteService (kostenlos)**
- Schnell einsatzbereit
- Keine Einrichtung notwendig
- Für bis zu 2.000 Anfragen/Tag ausreichend

### Phase 2: Wachstum
**Self-Hosting auf Hetzner**
- Server in Deutschland (Nürnberg/Falkenstein)
- DSGVO-konform
- Fixkosten von ~€15-20/Monat
- Unbegrenzte Anfragen

### Phase 3: Enterprise (optional)
**Dedizierter Server oder Cloud-Cluster**
- Bei sehr hohem Volumen (>500.000 Anfragen/Monat)
- Redundanz und Ausfallsicherheit
- ~€50-100/Monat

---

## Technische Details

### Datenfluss
```
Nutzer erstellt Route
        ↓
Frontend sendet Start/Ziel
        ↓
Backend fragt OSRM an
        ↓
OSRM berechnet optimale Strecke
        ↓
Route wird in Datenbank gespeichert
        ↓
Matching-Algorithmus findet passende Mitfahrer
```

### Datenschutz

- **Self-Hosting:** Alle Daten bleiben auf eigenem Server
- **Managed Services:** Anfragen werden an Drittanbieter gesendet
  - Bei EU-Anbietern (OpenRouteService): DSGVO-konform
  - Bei US-Anbietern: Datenschutzhinweis in AGB erforderlich

---

## Häufige Fragen

**Wer stellt die Rechnung?**
- Self-Hosting: Server-Anbieter (z.B. Hetzner) → Monatliche Rechnung für Server-Miete
- Managed Service: API-Anbieter → Rechnung basierend auf Nutzung

**Was passiert bei Ausfall?**
- Self-Hosting: Automatischer Neustart konfigurierbar, Backup-Server möglich
- Managed Service: Anbieter garantiert Verfügbarkeit (meist 99,9%)

**Kann ich später wechseln?**
- Ja, die Anwendung ist so gebaut, dass der Routing-Anbieter ausgetauscht werden kann
- Kein Datenverlust, da Routen in eigener Datenbank gespeichert werden

**Welche Kartendaten werden verwendet?**
- OpenStreetMap (OSM) - frei verfügbar und regelmäßig aktualisiert
- Qualität in Deutschland/Europa: Sehr gut
- Kosten für Kartendaten: €0

---

## Nächste Schritte

1. **Entscheidung** für Hosting-Modell treffen
2. **Budget** festlegen (€0-30/Monat realistisch)
3. **Timeline** für Produktivgang bestimmen
4. **Umsetzung** durch Entwicklungsteam

---

*Dokument erstellt: Januar 2026*
*Version: 1.0*
