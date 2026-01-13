# Digistore24 Integration Plan

## Übersicht

Digistore24 ist ein deutsches Zahlungsabwicklungssystem, das als Alternative zu Stripe verwendet werden kann.
Der Hauptunterschied: Digistore24 ist ein **Reseller-Modell** - sie verkaufen das Produkt in deinem Namen.

## Vergleich: Stripe vs. Digistore24

| Aspekt | Stripe | Digistore24 |
|--------|--------|-------------|
| Modell | Payment Processor | Reseller |
| Steuern | Du kümmerst dich | Digistore24 übernimmt |
| Rechnungen | Du erstellst | Digistore24 erstellt |
| Gebühren | ~2.9% + 0.30€ | ~7.9% + 1€ |
| Umsatzsteuer | Du führst ab | Digistore24 führt ab |
| Integration | API-basiert | Webhook + IPN |
| Ideal für | Tech-versierte | Digitale Produkte, Kurse |

## Technische Integration

### Option A: Reine Digistore24 Integration (empfohlen für deinen Use-Case)

**Vorteile:**
- Keine Umsatzsteuer-Abführung nötig
- Digistore24 erstellt alle Rechnungen
- In Deutschland bekannt und vertrauenswürdig
- Einfachere Buchhaltung

**Nachteile:**
- Höhere Gebühren
- Weniger Kontrolle über den Checkout
- Benutzer wird zu Digistore24 weitergeleitet

### Ablauf

```
User klickt "Abo abschließen"
        ↓
Redirect zu Digistore24 Checkout
        ↓
Zahlung bei Digistore24
        ↓
Digistore24 sendet IPN/Webhook
        ↓
Dein Server aktiviert Subscription
```

### Implementierung

#### 1. Produkte bei Digistore24 anlegen

Bei Digistore24 im Dashboard:
- Produkt "Carcashflow Basis" (4,99€/Monat)
- Produkt "Carcashflow Premium" (9,99€/Monat)
- Optional: "Carcashflow Lifetime" (Einmalzahlung)

Wichtig: Bei Abos den "Abo-Intervall" auf "Monatlich" setzen.

#### 2. API Endpoint für IPN (Instant Payment Notification)

```typescript
// app/api/digistore24/webhook/route.ts

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// Digistore24 IPN-Daten Typen
interface DigiStore24IPN {
  event: "payment" | "refund" | "rebill" | "cancellation" | "chargeback"
  transaction_id: string
  product_id: string
  email: string
  custom?: string // Hier speichern wir die user_id
  order_id: string
  payment_method: string
  sha_sign: string
  affiliate_name?: string
  amount: string
  currency: string
  next_payment_at?: string
  subscription_id?: string
}

// Verify Digistore24 signature
function verifySignature(data: DigiStore24IPN, secret: string): boolean {
  // Digistore24 verwendet eine spezielle Signatur
  // Details in deren Dokumentation
  const expectedSign = crypto
    .createHmac("sha256", secret)
    .update(data.transaction_id + data.email)
    .digest("hex")

  return data.sha_sign === expectedSign
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const data: Partial<DigiStore24IPN> = {}

    formData.forEach((value, key) => {
      data[key as keyof DigiStore24IPN] = value as string
    })

    const ipnData = data as DigiStore24IPN

    // Verify signature (falls aktiviert)
    const secret = process.env.DIGISTORE24_IPN_SECRET!
    if (secret && !verifySignature(ipnData, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Supabase Admin Client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // User ID aus custom field
    const userId = ipnData.custom
    if (!userId) {
      console.error("No user_id in custom field")
      return NextResponse.json({ error: "No user_id" }, { status: 400 })
    }

    // Event handling
    switch (ipnData.event) {
      case "payment":
      case "rebill":
        // Subscription aktivieren
        await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_tier: mapProductToTier(ipnData.product_id),
            digistore_customer_id: ipnData.email,
            digistore_subscription_id: ipnData.subscription_id,
            current_period_end: ipnData.next_payment_at
              ? new Date(ipnData.next_payment_at).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
        break

      case "cancellation":
        // Subscription als gekündigt markieren (läuft bis Periodenende)
        await supabase
          .from("profiles")
          .update({
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
        break

      case "refund":
      case "chargeback":
        // Sofortiger Zugriffsentzug
        await supabase
          .from("profiles")
          .update({
            subscription_status: "frozen",
            subscription_tier: "trial",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
        break
    }

    // Digistore24 erwartet "OK" als Antwort
    return new NextResponse("OK", { status: 200 })

  } catch (error) {
    console.error("Digistore24 webhook error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

function mapProductToTier(productId: string): string {
  // Mapping deiner Digistore24 Produkt-IDs zu Subscription Tiers
  const mapping: Record<string, string> = {
    "PRODUCT_ID_BASIC": "basic",
    "PRODUCT_ID_PREMIUM": "premium",
    "PRODUCT_ID_LIFETIME": "lifetime",
  }
  return mapping[productId] || "basic"
}
```

#### 3. Checkout URL generieren

```typescript
// lib/digistore24.ts

interface CheckoutParams {
  productId: string
  userId: string
  email: string
  firstName?: string
  lastName?: string
}

export function generateDigistore24CheckoutUrl(params: CheckoutParams): string {
  const baseUrl = "https://www.digistore24.com/product/"

  // URL Parameter für Pre-fill und Tracking
  const urlParams = new URLSearchParams({
    custom: params.userId, // Wird im IPN zurückgegeben
    email: params.email,
    ...(params.firstName && { first_name: params.firstName }),
    ...(params.lastName && { last_name: params.lastName }),
  })

  return `${baseUrl}${params.productId}?${urlParams.toString()}`
}
```

#### 4. UI-Integration (Pricing Page)

```typescript
// In der Pricing-Seite

function handleCheckout(tier: "basic" | "premium") {
  const productIds = {
    basic: process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_BASIC,
    premium: process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_PREMIUM,
  }

  const checkoutUrl = generateDigistore24CheckoutUrl({
    productId: productIds[tier]!,
    userId: user.id,
    email: user.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
  })

  // Redirect zu Digistore24
  window.location.href = checkoutUrl
}
```

## Environment Variables

```env
# Digistore24
DIGISTORE24_IPN_SECRET=dein_ipn_passphrase
NEXT_PUBLIC_DIGISTORE_PRODUCT_BASIC=123456
NEXT_PUBLIC_DIGISTORE_PRODUCT_PREMIUM=789012
```

## Datenbank-Änderungen

Die `profiles` Tabelle benötigt zusätzliche Felder:

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS digistore_customer_id TEXT,
ADD COLUMN IF NOT EXISTS digistore_subscription_id TEXT;
```

## Schritte zur Implementierung

### Was du (der Kunde/Betreiber) tun musst:

1. **Digistore24 Account erstellen** (falls nicht vorhanden)
   - https://www.digistore24.com/signup/vendor

2. **Produkte anlegen:**
   - Vendoren-Dashboard öffnen
   - Neues Produkt erstellen
   - Produktart: "Abonnement" für Basis/Premium
   - Preis und Intervall festlegen
   - Zahlungsseite konfigurieren

3. **IPN-URL konfigurieren:**
   - Dashboard > Einstellungen > IPN
   - URL: `https://car-cash-flow.vercel.app/api/digistore24/webhook`
   - IPN-Passphrase erstellen und speichern

4. **Produkt-IDs notieren:**
   - Jedes Produkt hat eine eindeutige ID
   - Diese brauchst du für die Environment Variables

5. **Environment Variables in Vercel setzen:**
   - DIGISTORE24_IPN_SECRET
   - NEXT_PUBLIC_DIGISTORE_PRODUCT_BASIC
   - NEXT_PUBLIC_DIGISTORE_PRODUCT_PREMIUM

### Was ich (Claude) implementiere:

1. ✅ API Route für Digistore24 Webhooks (IPN)
2. ✅ Checkout-URL Generierung
3. ✅ Subscription-Status Updates
4. ✅ UI-Anpassungen für Digistore24 Checkout
5. ✅ Datenbank-Migration für neue Felder

## Wichtige Hinweise

### Testmodus
- Digistore24 hat einen Sandbox-Modus
- Erst im Sandbox testen, dann live schalten

### Steuern
- Digistore24 kümmert sich um die Umsatzsteuer
- Du bekommst den Netto-Betrag minus Gebühren

### Rechnungen
- Kunden erhalten Rechnungen von Digistore24
- Du brauchst keine eigene Rechnungserstellung

### Support
- Bei Zahlungsproblemen wenden sich Kunden an Digistore24
- Du hast weniger Support-Aufwand

---

## Alternative: Beides (Stripe + Digistore24)

Falls gewünscht, können wir auch beide Zahlungsanbieter anbieten:
- Stripe für internationale Kunden
- Digistore24 für deutsche Kunden

Dies erhöht die Komplexität, aber bietet mehr Flexibilität.

---

## Fazit

Für deinen Use-Case (deutsche Zielgruppe, Abo-Modell) ist Digistore24 eine gute Alternative zu Stripe:

**Pro:**
- Weniger steuerlicher Aufwand
- In DE bekannt und vertrauenswürdig
- Automatische Rechnungserstellung

**Contra:**
- Höhere Gebühren (~7.9% vs ~2.9%)
- Weniger technische Kontrolle
- Externe Checkout-Seite

**Meine Empfehlung:** Da dein Kunde bereits Digistore24 nutzt und die Zielgruppe deutsch ist,
macht die Integration Sinn. Die höheren Gebühren werden durch weniger Verwaltungsaufwand ausgeglichen.
