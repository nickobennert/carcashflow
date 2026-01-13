"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  Car,
  ArrowRight,
  Users,
  MapPin,
  Shield,
  MessageSquare,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  staggerContainer,
  staggerItem,
  fadeIn,
} from "@/lib/animations"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-offer to-request">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Carcashflow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-medium">
                Anmelden
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="bg-gradient-to-r from-offer to-request text-white hover:opacity-90 transition-opacity"
              >
                Kostenlos starten
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 md:pt-32 md:pb-40">
        {/* Subtle gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-offer/20 to-request/20 rounded-full blur-3xl opacity-50" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative mx-auto max-w-3xl text-center"
        >
          {/* Badge */}
          <motion.div variants={staggerItem} className="mb-6">
            <Badge
              variant="secondary"
              className="px-4 py-1.5 text-sm font-medium bg-background border"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5 text-offer" />
              30 Tage kostenlos testen
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={staggerItem}
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
          >
            Mitfahrbörse für
            <br />
            <span className="bg-gradient-to-r from-offer to-request bg-clip-text text-transparent">
              Schulungsteilnehmer
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={staggerItem}
            className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
          >
            Organisiere Rückfahrten effizient mit anderen Teilnehmern.
            Biete Fahrten an, finde Mitfahrgelegenheiten und spare Kosten.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={staggerItem}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-8 text-base bg-foreground text-background hover:bg-foreground/90"
              >
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={staggerItem}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-offer" />
              <span>Keine Kreditkarte erforderlich</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-offer" />
              <span>Sofort einsatzbereit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-offer" />
              <span>DSGVO-konform</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Problem Statement */}
      <section className="px-6 py-16 text-center">
        <motion.div
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-2xl"
        >
          <h2 className="text-2xl font-bold md:text-3xl">
            Rückfahrten organisieren ist umständlich
          </h2>
          <p className="mt-4 text-lg text-muted-foreground italic">
            Deshalb haben wir die Lösung gebaut, die wir uns immer gewünscht haben
          </p>
        </motion.div>
      </section>

      {/* Step 1 */}
      <section className="px-6 py-20">
        <motion.div
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-sm text-muted-foreground">01</span>
          <h3 className="mt-2 text-2xl font-bold md:text-3xl">
            Teile deine Route
          </h3>
          <p className="mt-2 text-lg italic text-muted-foreground">
            mit anderen Teilnehmern
          </p>
          <p className="mx-auto mt-6 max-w-lg text-muted-foreground">
            Gib deinen <strong>Start- und Zielort</strong> an. Füge Zwischenstopps hinzu,
            wenn du auf dem Weg jemanden mitnehmen kannst.
          </p>

          {/* Visual placeholder - Route Card Mockup */}
          <div className="mx-auto mt-10 max-w-md">
            <div className="rounded-2xl border bg-card p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-offer/10">
                  <MapPin className="h-5 w-5 text-offer" />
                </div>
                <div className="text-left">
                  <p className="font-medium">München → Hamburg</p>
                  <p className="text-sm text-muted-foreground">15. Januar 2026 · 3 Plätze frei</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-offer/10 text-offer border-0">
                  Bietet Plätze
                </Badge>
                <Badge variant="secondary">Flexibel</Badge>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Step 2 */}
      <section className="px-6 py-20 bg-muted/30">
        <motion.div
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-sm text-muted-foreground">02</span>
          <h3 className="mt-2 text-2xl font-bold md:text-3xl">
            Finde passende Fahrten
          </h3>
          <p className="mt-2 text-lg italic text-muted-foreground">
            (keine endlosen Gruppenanfragen mehr)
          </p>
          <p className="mx-auto mt-6 max-w-lg text-muted-foreground">
            Unsere Plattform zeigt dir <strong>alle verfügbaren Angebote und Gesuche</strong> auf einen Blick.
            Filter nach Datum, Ort und Typ.
          </p>

          {/* Visual - Filter Mockup */}
          <div className="mx-auto mt-10 max-w-lg">
            <div className="rounded-2xl border bg-card p-6 shadow-lg">
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge className="bg-offer text-white border-0">Alle Routen</Badge>
                <Badge variant="outline">Angebote</Badge>
                <Badge variant="outline">Gesuche</Badge>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-offer/10 flex items-center justify-center text-sm font-medium">M</div>
                    <div className="text-left text-sm">
                      <p className="font-medium">Berlin → Köln</p>
                      <p className="text-muted-foreground">Morgen · 2 Plätze</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-offer/10 text-offer border-0 text-xs">Bietet</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-request/10 flex items-center justify-center text-sm font-medium">S</div>
                    <div className="text-left text-sm">
                      <p className="font-medium">Frankfurt → Stuttgart</p>
                      <p className="text-muted-foreground">Fr, 17. Jan</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-request/10 text-request border-0 text-xs">Sucht</Badge>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Step 3 */}
      <section className="px-6 py-20">
        <motion.div
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-sm text-muted-foreground">03</span>
          <h3 className="mt-2 text-2xl font-bold md:text-3xl">
            Nimm Kontakt auf
          </h3>
          <p className="mt-2 text-lg italic text-muted-foreground">
            sicher und direkt
          </p>
          <p className="mx-auto mt-6 max-w-lg text-muted-foreground">
            Schreibe anderen Nutzern über unser <strong>internes Nachrichtensystem</strong>.
            Deine Kontaktdaten bleiben privat, bis du sie teilen möchtest.
          </p>

          {/* Visual - Chat Mockup */}
          <div className="mx-auto mt-10 max-w-sm">
            <div className="rounded-2xl border bg-card p-4 shadow-lg">
              <div className="flex items-center gap-3 border-b pb-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium">TM</div>
                <div className="text-left">
                  <p className="font-medium text-sm">Thomas M.</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2 max-w-[80%]">
                    Hey, hast du noch Plätze frei für morgen?
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-sm bg-offer text-white px-4 py-2 max-w-[80%]">
                    Ja klar! Noch 2 Plätze. Wohin genau musst du?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-muted/30">
        <motion.div
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-3xl text-center"
        >
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="text-2xl font-bold md:text-3xl">
            Alles was du brauchst
          </h2>
          <p className="mt-4 text-muted-foreground">
            Eine Plattform, die speziell für Schulungsteilnehmer entwickelt wurde.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {[
            {
              icon: Car,
              title: "Angebote & Gesuche",
              description: "Erstelle in Sekunden ein Angebot oder Gesuch für deine Fahrt.",
            },
            {
              icon: MessageSquare,
              title: "Internes Messaging",
              description: "Kommuniziere sicher mit anderen Nutzern - ohne deine Nummer zu teilen.",
            },
            {
              icon: Shield,
              title: "Verifizierte Nutzer",
              description: "Nur echte Schulungsteilnehmer haben Zugang zur Plattform.",
            },
            {
              icon: MapPin,
              title: "Zwischenstopps",
              description: "Sammle unterwegs weitere Mitfahrer ein oder steige zu.",
            },
            {
              icon: Users,
              title: "Community",
              description: "Vernetze dich mit anderen Teilnehmern und spare gemeinsam.",
            },
            {
              icon: Sparkles,
              title: "Einfach & schnell",
              description: "Keine komplizierten Formulare. In unter 5 Minuten startklar.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="rounded-xl border bg-card p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <feature.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <motion.div
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold md:text-4xl">
            Die moderne
            <br />
            <span className="italic text-muted-foreground">Mitfahrbörse</span>
            <br />
            ist da
          </h2>

          <p className="mx-auto mt-6 max-w-md text-muted-foreground">
            Registriere dich jetzt kostenlos und finde deine nächste Mitfahrgelegenheit.
            Der erste Monat ist komplett gratis.
          </p>

          <div className="mt-8">
            <Link href="/signup">
              <Button
                size="lg"
                className="h-12 px-8 text-base bg-foreground text-background hover:bg-foreground/90"
              >
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-20 bg-muted/30">
        <motion.div
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge variant="outline" className="mb-4">FAQ</Badge>
          <h2 className="text-2xl font-bold md:text-3xl">
            Häufig gestellte Fragen
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto mt-10 max-w-2xl space-y-4"
        >
          {[
            {
              q: "Ist Carcashflow wirklich kostenlos?",
              a: "Der erste Monat ist komplett kostenlos. Danach kannst du zwischen verschiedenen günstigen Abo-Optionen wählen.",
            },
            {
              q: "Wer kann die Plattform nutzen?",
              a: "Carcashflow ist exklusiv für Schulungsteilnehmer. Nur verifizierte Nutzer haben Zugang.",
            },
            {
              q: "Wie funktioniert die Kontaktaufnahme?",
              a: "Du kannst über unser internes Nachrichtensystem Kontakt aufnehmen. Deine persönlichen Daten bleiben geschützt.",
            },
            {
              q: "Gibt es eine Vermittlungsgebühr?",
              a: "Nein, Carcashflow vermittelt keine Fahrten. Wir stellen nur die Plattform zur Kontaktanbahnung bereit.",
            },
          ].map((faq, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="rounded-xl border bg-card p-6 text-left"
            >
              <h3 className="font-semibold">{faq.q}</h3>
              <p className="mt-2 text-muted-foreground">{faq.a}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-offer to-request">
                <Car className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Carcashflow</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/impressum" className="hover:text-foreground transition-colors">
                Impressum
              </Link>
              <Link href="/datenschutz" className="hover:text-foreground transition-colors">
                Datenschutz
              </Link>
              <Link href="/agb" className="hover:text-foreground transition-colors">
                AGB
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Carcashflow
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
