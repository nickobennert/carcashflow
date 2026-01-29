# Route-Matching Testen

## 1. Testdaten einfuegen

1. Supabase Dashboard oeffnen > SQL Editor
2. Inhalt von `docs/test-data.sql` einfuegen und ausfuehren
3. Verifizieren: 6 Profiles, 8 Offers, 6 Requests

## 2. Test-Szenarien

### Login-Daten
Alle Test-User haben das Passwort: `TestPass123!`

| User   | Email                        | Stadt      |
|--------|------------------------------|------------|
| Max    | max@test.carcashflow.de      | Muenchen   |
| Lisa   | lisa@test.carcashflow.de     | Nuernberg  |
| Tom    | tom@test.carcashflow.de      | Frankfurt  |
| Anna   | anna@test.carcashflow.de     | Hamburg    |
| Jan    | jan@test.carcashflow.de      | Koeln      |
| Sophie | sophie@test.carcashflow.de   | Stuttgart  |

### Szenario 1: Exaktes Match
**Als Lisa einloggen**, neue Route erstellen:
- Typ: Suche (request)
- Start: Muenchen
- Ziel: Berlin
- Datum: uebermorgen

**Erwartet:** Max's Angebot "Muenchen -> Berlin" erscheint als Match mit hoher Similarity (90%+) und Badge "Auf der Route"

### Szenario 2: Teilstrecke (Route-auf-Route)
**Als Tom einloggen**, neue Route erstellen:
- Typ: Suche (request)
- Start: Muenchen
- Ziel: Berlin
- Datum: uebermorgen

**Erwartet:** Lisa's Angebot "Nuernberg -> Leipzig" erscheint als Match mit "Auf der Route" oder "X km Umweg" Badge, weil Nuernberg und Leipzig auf dem Weg Muenchen->Berlin liegen.

### Szenario 3: Kleiner Umweg (Autobahn-Abfahrt)
**Als Tom einloggen**, neue Route erstellen:
- Typ: Suche (request)
- Start: Nuernberg
- Ziel: Bamberg
- Datum: uebermorgen

**Erwartet:** Lisa's Angebot "Erlangen -> Bamberg" erscheint. Erlangen liegt ca. 2km neben der A3 = "Auf der Route" oder "2 km Umweg"

### Szenario 4: Mittlerer Umweg
**Als Anna einloggen**, neue Route erstellen:
- Typ: Suche (request)
- Start: Muenchen
- Ziel: Berlin
- Datum: uebermorgen

**Erwartet:** Max's Angebot "Muenchen -> Berlin" mit hohem Match. Tom's "Wuerzburg -> Erfurt" sollte NICHT als direkter Match erscheinen (request, nicht offer), aber als Gegenpart pruefen.

### Szenario 5: Gegenrichtung (kein Match)
**Als Sophie einloggen**, neue Route erstellen:
- Typ: Angebot (offer)
- Start: Muenchen
- Ziel: Berlin
- Datum: in 4 Tagen

**Erwartet:** Max's Suche "Berlin -> Muenchen" sollte erscheinen (Gegenrichtung = Suche passend zum Angebot). Die Corridor-Checks sollten diese als "gleiche Richtung" erkennen, OBWOHL es die Gegenrichtung ist - das ist bewusst so, da der Suchende ja in die andere Richtung will.

### Szenario 6: Komplett andere Route
**Als Lisa einloggen**, neue Route erstellen:
- Typ: Suche (request)
- Start: Hamburg
- Ziel: Koeln
- Datum: in 3 Tagen

**Erwartet:** Keine der Muenchen-Berlin Routen sollten matchen. Evtl. Anna's "Hamburg -> Muenchen" mit schwachem Match (Start stimmt ueberein).

## 3. Was pruefen?

### In der UI (Create Ride Drawer/Dialog):
- [ ] MatchingRides-Karte erscheint nach Eingabe von Start + Ziel
- [ ] Badges zeigen korrekte Stufen:
  - Gruen "Auf der Route" (< 5 km)
  - Gelb "X km Umweg" (5-15 km)
  - Grau "X km Umweg" (15-30 km)
- [ ] "Alle Ergebnisse anzeigen" oeffnet Dashboard mit Filtern
- [ ] Klick auf Match oeffnet das Ride-Detail

### Im Dashboard:
- [ ] Filter funktionieren (Typ, Datum, Ort)
- [ ] Rides werden korrekt angezeigt
- [ ] Kontakt-Button oeffnet Conversation

### Fehlerszenarien:
- [ ] Keine Matches = Karte wird ausgeblendet (nicht leer angezeigt)
- [ ] Eigene Rides werden nicht als Match vorgeschlagen
- [ ] Abgelaufene Rides werden nicht angezeigt

## 4. Cleanup vor Launch

SQL im Supabase SQL Editor ausfuehren:
```sql
-- Cleanup-Block am Ende von test-data.sql auskommentieren und ausfuehren
```
