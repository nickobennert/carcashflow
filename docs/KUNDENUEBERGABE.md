# Fahr mit! - Kundenübergabe Dokument

**Datum:** 11. Februar 2026
**Status:** ✅ Ready for Beta!

---

## 1. Was ist fertig

Die Anwendung "Fahr mit!" ist vollständig entwickelt und einsatzbereit:

- ✅ Alle Features implementiert und getestet
- ✅ Komplett kostenlos für Nutzer (kein Abo-System)
- ✅ DSGVO-konform (Daten-Export, Account-Löschung)
- ✅ Impressum & Datenschutz integriert
- ✅ Sicherheitscheck durchgeführt
- ✅ Admin-Bereich für Moderation
- ✅ Echtzeit-Nachrichten
- ✅ Intelligentes Route-Matching
- ✅ Route-Benachrichtigungen (In-App)
- ✅ E-Mail-Templates eingerichtet (Registrierung, Login, Passwort-Reset)

**⚠️ Hinweis:** Wir sind keine Datenschutzbeauftragten - empfehlen, einen Profi drüberschauen zu lassen.

---

## 2. Was noch gebraucht wird

### 2.1 Domain einrichten

Eine Subdomain für die App einrichten:
```
app.carcashflow.de
```

Die Domain wird dann in Vercel konfiguriert.

---

### 2.2 Vercel Pro aktivieren

**Kosten:** ~$20/Monat (~€18)

**Warum nötig:**
- Vercel Hobby ist **nicht für kommerzielle Nutzung** erlaubt
- Bessere Performance & höhere Limits

**So geht's:**
1. vercel.com aufrufen
2. Zum Projekt navigieren
3. Settings → Billing → Upgrade to Pro

---

### 2.3 Supabase Pro aktivieren

**Kosten:** ~$25/Monat (~€23)

**Warum nötig:**
- Mehr Speicher (8 GB statt 500 MB)
- Besserer Support
- Point-in-time Backups

**So geht's:**
1. supabase.com aufrufen
2. Zum Projekt navigieren
3. Settings → Billing → Upgrade

---

### 2.4 Google Maps API einrichten

**Kosten:** $200 Guthaben/Monat kostenlos, danach ~$5 pro 1.000 Requests

**Was benötigt wird:**
1. Google Cloud Console Account erstellen (cloud.google.com)
2. Neues Projekt anlegen
3. Zahlungsmethode hinterlegen (Kreditkarte)
4. Folgende APIs aktivieren:
   - Maps JavaScript API
   - Places API
   - Directions API
5. API Key erstellen
6. **API Key an uns schicken** - wir bauen es ein

**Geschätzte Kosten bei 100 aktiven Nutzern:** meist im Free-Tier, maximal ~$50-100/Monat

---

### 2.5 E-Mail-Benachrichtigungen (Optional)

**Aktueller Stand:**
- Auth-E-Mails funktionieren bereits (Registrierung, Passwort-Reset)
- Für E-Mail-Benachrichtigungen bei neuen Nachrichten etc. brauchen wir einen Provider

**Empfehlung: Resend**

**Kosten:** Free Tier (3.000 E-Mails/Monat) oder ~$20/Monat für 50.000 E-Mails

**Was benötigt wird:**
1. Account bei resend.com erstellen
2. Domain verifizieren (DNS-Eintrag - wir helfen dabei)
3. API Key erstellen und uns schicken

---

## 3. Kostenübersicht

### Minimal (Beta-Start)

| Dienst | Kosten/Monat |
|--------|-------------|
| Vercel Pro | ~€18 |
| Supabase Pro | ~€23 |
| Google Maps | €0 (Free Tier) |
| **Gesamt** | **~€41/Monat** |

### Mit E-Mail-Benachrichtigungen

| Dienst | Kosten/Monat |
|--------|-------------|
| Vercel Pro | ~€18 |
| Supabase Pro | ~€23 |
| Google Maps | €0-€45 |
| Resend | €0-€18 |
| **Gesamt** | **~€41-€104/Monat** |

---

## 4. Checkliste vor Go-Live

### Ihr macht:

- [ ] Domain einrichten: `app.carcashflow.de`
- [ ] Vercel Pro aktivieren
- [ ] Supabase Pro aktivieren
- [ ] Google Cloud Account erstellen & API Key generieren
- [ ] (Optional) Resend Account erstellen

### Wir machen:

- [ ] Domain in Vercel konfigurieren
- [ ] Google Maps API Key einbauen
- [ ] (Optional) Resend einrichten für E-Mail-Benachrichtigungen
- [ ] Finale Tests vor Launch

---

## 5. Support

Bei Fragen oder Problemen einfach melden!

### Logs prüfen

- **Vercel:** Dashboard → Projekt → Logs
- **Supabase:** Dashboard → Logs

---

## 6. Technische Dokumentation

Weitere Details für Entwickler:
- `CLAUDE.md` - Vollständige technische Dokumentation
