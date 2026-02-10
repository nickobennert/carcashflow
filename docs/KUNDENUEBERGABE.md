# Fahr mit! - Kundenübergabe Dokument

**Datum:** 10. Februar 2026
**Status:** Produktionsreif

---

## 1. Aktueller Stand

Die Anwendung "Fahr mit!" ist vollständig entwickelt und einsatzbereit:

- ✅ Alle Features implementiert
- ✅ Komplett kostenlos (kein Abo-System)
- ✅ DSGVO-konform (Daten-Export, Account-Löschung)
- ✅ Admin-Bereich für Moderation
- ✅ Echtzeit-Nachrichten
- ✅ Intelligentes Route-Matching
- ✅ Route-Benachrichtigungen

---

## 2. Vor dem Launch: Datenbank bereinigen

### Schritt 1: Demo-Daten löschen

Im Supabase Dashboard > SQL Editor das Script ausführen:
`supabase/scripts/production_cleanup_final.sql`

Das Script:
- Löscht alle Demo-Daten (Rides, Messages, etc.)
- Entfernt nicht mehr benötigte Tabellen (promo_codes, subscription_tiers)
- Entfernt Subscription-Spalten aus profiles
- Behält super_admins Tabelle

### Schritt 2: Admin-User einrichten

Im Supabase Dashboard > SQL Editor:
```sql
INSERT INTO super_admins (user_id, role)
SELECT id, 'super_admin'
FROM profiles
WHERE email = 'admin@ihre-domain.de'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
```

---

## 3. Kostenpflichtige Upgrades

### 3.1 Routing-Dienst: OpenRouteService → Google Maps

**Aktueller Stand:** OpenRouteService (ORS) Free Tier
- 2.000 Requests/Tag kostenlos
- Ausreichend für kleine bis mittlere Nutzerzahlen

**Option: Google Maps Platform**

| Aspekt | Details |
|--------|---------|
| **Dienst** | Directions API + Places API |
| **Kosten** | $200 Guthaben/Monat kostenlos |
| **Danach** | ~$5 pro 1.000 Requests |
| **Vorteile** | Bessere Datenqualität, schneller, zuverlässiger |
| **Nachteile** | Teurer bei hohem Traffic |

**Geschätzte Kosten bei 100 aktiven Nutzern:**
- ~500-1.000 Requests/Tag
- Meist im Free-Tier ($200 Guthaben)
- Bei Überschreitung: ~$50-100/Monat

**Empfehlung:** Mit ORS starten, bei Problemen auf Google Maps wechseln.

---

### 3.2 Supabase Pro aktivieren

**Aktueller Stand:** Supabase Free Tier

| Limit | Free | Pro |
|-------|------|-----|
| Datenbank | 500 MB | 8 GB |
| Speicher | 1 GB | 100 GB |
| Bandwidth | 2 GB | 250 GB |
| Auth Users | Unlimited | Unlimited |
| Edge Functions | 500K/Monat | 2M/Monat |

**Kosten:** $25/Monat

**Wann upgraden?**
- Mehr als 500 MB Datenbankgröße
- Mehr als 1 GB Avatare/Uploads
- Mehr als 2 GB Traffic/Monat
- Für besseren Support

**Empfehlung:** Mit Free Tier starten, bei Bedarf upgraden.

---

### 3.3 Vercel Pro aktivieren

**Aktueller Stand:** Vercel Hobby (kostenlos)

| Limit | Hobby | Pro |
|-------|-------|-----|
| Bandwidth | 100 GB | 1 TB |
| Serverless Execution | 100 GB-Hrs | 1.000 GB-Hrs |
| Team Members | 1 | Unlimited |
| Commercial Use | ❌ | ✅ |

**Kosten:** $20/Monat

**Wichtig:** Vercel Hobby ist **nicht für kommerzielle Nutzung** erlaubt!

**Empfehlung:** Sofort auf Pro wechseln wenn die App kommerziell genutzt wird.

---

### 3.4 E-Mail-Benachrichtigungen

**Aktueller Stand:** Keine E-Mail-Benachrichtigungen

**Option A: Resend (Empfohlen)**

| Aspekt | Details |
|--------|---------|
| **Free Tier** | 3.000 E-Mails/Monat |
| **Pro** | $20/Monat für 50.000 E-Mails |
| **Integration** | Einfache API, React Email Templates |
| **Domain** | Eigene Domain empfohlen |

**Implementierungsaufwand:** ~4-8 Stunden

**Option B: Supabase Auth E-Mails (bereits aktiv)**
- Authentifizierungs-E-Mails funktionieren bereits
- Begrenzt auf Auth-Flows (Signup, Password Reset)

**Option C: Google Workspace / Gmail SMTP**

| Aspekt | Details |
|--------|---------|
| **Kosten** | $6/Monat (Google Workspace Starter) |
| **Limit** | 500 E-Mails/Tag |
| **Vorteil** | Professionelle @ihre-domain.de E-Mails |

**Empfehlung:** Resend für Transaktions-E-Mails, optional Google Workspace für Support-Kommunikation.

---

## 4. Kostenübersicht

### Minimal-Setup (Launch)

| Dienst | Kosten/Monat |
|--------|-------------|
| Supabase Free | €0 |
| Vercel Hobby* | €0 |
| OpenRouteService | €0 |
| **Gesamt** | **€0** |

*⚠️ Vercel Hobby nur für nicht-kommerzielle Nutzung!

### Empfohlenes Setup (Kommerziell)

| Dienst | Kosten/Monat |
|--------|-------------|
| Supabase Free | €0 |
| Vercel Pro | ~€18 ($20) |
| OpenRouteService | €0 |
| Resend Free | €0 |
| **Gesamt** | **~€18/Monat** |

### Vollausbau (Wachstum)

| Dienst | Kosten/Monat |
|--------|-------------|
| Supabase Pro | ~€23 ($25) |
| Vercel Pro | ~€18 ($20) |
| Google Maps | ~€45-90 |
| Resend Pro | ~€18 ($20) |
| **Gesamt** | **~€100-150/Monat** |

---

## 5. Nächste Schritte

### Sofort (vor Launch)

1. [ ] Production Cleanup Script ausführen
2. [ ] Admin-User einrichten
3. [ ] Vercel Pro aktivieren (für kommerziellen Betrieb)
4. [ ] Domain konfigurieren
5. [ ] Datenschutzerklärung finalisieren (`/datenschutz`)

### Später (bei Bedarf)

1. [ ] E-Mail-Benachrichtigungen mit Resend implementieren
2. [ ] Auf Google Maps wechseln (wenn ORS limitiert)
3. [ ] Supabase Pro (wenn Limits erreicht)

---

## 6. Support & Wartung

### Laufende Wartung

- **Supabase:** Automatische Backups (Pro: Point-in-time Recovery)
- **Vercel:** Zero-Config Deployments bei Git Push
- **Updates:** Node.js und npm Dependencies regelmäßig aktualisieren

### Bei Problemen

1. **Vercel Logs:** Dashboard > Projekt > Logs
2. **Supabase Logs:** Dashboard > Logs > Edge Functions / API
3. **Browser Console:** F12 > Console für Frontend-Fehler

---

## 7. Technische Dokumentation

Weitere Details in:
- `CLAUDE.md` - Vollständige technische Dokumentation
- `docs/ROUTING_HOSTING_OPTIONEN.md` - Routing-Infrastruktur Details
