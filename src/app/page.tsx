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
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  staggerContainer,
  staggerItem,
  fadeIn,
} from "@/lib/animations"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center space-x-2">
            <Car className="h-6 w-6" />
            <span className="text-lg font-semibold">Carcashflow</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Anmelden
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Registrieren
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mx-auto max-w-3xl text-center"
        >
          {/* Small label */}
          <motion.p
            variants={staggerItem}
            className="mb-4 text-sm text-muted-foreground"
          >
            Die Mitfahrbörse für Schulungsteilnehmer
          </motion.p>

          {/* Headline */}
          <motion.h1
            variants={staggerItem}
            className="text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl"
          >
            Rückfahrten effizient
            <br />
            organisieren
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={staggerItem}
            className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground"
          >
            Biete Fahrten an, finde Mitfahrgelegenheiten und vernetze dich mit anderen Teilnehmern. Kostenlos für 30 Tage.
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={staggerItem}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto h-11 px-6">
                Kostenlos starten
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-11 px-6">
                Anmelden
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Product Preview */}
      <section className="px-6 pb-20">
        <motion.div
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-4xl"
        >
          <div className="rounded-xl border bg-card p-2 shadow-2xl shadow-black/5">
            <div className="rounded-lg border bg-muted/30 p-8">
              {/* Mock Dashboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-foreground/20" />
                    <span className="text-sm font-medium">Verfügbare Fahrten</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="rounded-md bg-foreground px-3 py-1 text-xs text-background">Alle</div>
                    <div className="rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">Angebote</div>
                    <div className="rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">Gesuche</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { from: "München", to: "Hamburg", date: "Mo, 20. Jan", seats: 3, type: "offer" },
                    { from: "Berlin", to: "Köln", date: "Di, 21. Jan", seats: 2, type: "offer" },
                    { from: "Frankfurt", to: "Stuttgart", date: "Mi, 22. Jan", seats: null, type: "request" },
                  ].map((ride, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border bg-background p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {ride.from[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{ride.from} → {ride.to}</p>
                          <p className="text-xs text-muted-foreground">{ride.date}{ride.seats && ` · ${ride.seats} Plätze`}</p>
                        </div>
                      </div>
                      <div className={`rounded-full px-2.5 py-0.5 text-xs ${
                        ride.type === "offer"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}>
                        {ride.type === "offer" ? "Bietet" : "Sucht"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="border-t px-6 py-20">
        <motion.div
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-5xl"
        >
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm text-muted-foreground">Features</p>
            <h2 className="text-2xl font-medium md:text-3xl">
              Alles was du brauchst
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Routen teilen",
                description: "Erstelle Angebote oder Gesuche mit Start, Ziel und optionalen Zwischenstopps.",
              },
              {
                icon: MessageSquare,
                title: "Sicher kommunizieren",
                description: "Internes Nachrichtensystem. Deine Kontaktdaten bleiben privat.",
              },
              {
                icon: Shield,
                title: "Verifizierte Nutzer",
                description: "Nur echte Schulungsteilnehmer haben Zugang zur Plattform.",
              },
              {
                icon: Zap,
                title: "Schnell starten",
                description: "In unter 5 Minuten registriert und einsatzbereit.",
              },
              {
                icon: Users,
                title: "Community",
                description: "Vernetze dich mit anderen Teilnehmern und spare gemeinsam.",
              },
              {
                icon: Car,
                title: "Flexibel planen",
                description: "Filter nach Datum, Ort und Typ. Finde immer die passende Fahrt.",
              },
            ].map((feature, index) => (
              <div key={index} className="space-y-3">
                <feature.icon className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="border-t px-6 py-20">
        <motion.div
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm text-muted-foreground">So funktioniert&apos;s</p>
            <h2 className="text-2xl font-medium md:text-3xl">
              In drei Schritten zur Mitfahrt
            </h2>
          </div>

          <div className="space-y-12">
            {[
              {
                step: "01",
                title: "Registrieren",
                description: "Erstelle kostenlos einen Account. Keine Kreditkarte erforderlich.",
              },
              {
                step: "02",
                title: "Route einstellen",
                description: "Biete freie Plätze an oder suche eine Mitfahrgelegenheit für deine Strecke.",
              },
              {
                step: "03",
                title: "Kontakt aufnehmen",
                description: "Finde passende Angebote und schreibe anderen Nutzern direkt über die Plattform.",
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-6">
                <div className="text-sm text-muted-foreground font-mono">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-medium mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="border-t px-6 py-20">
        <motion.div
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm text-muted-foreground">FAQ</p>
            <h2 className="text-2xl font-medium md:text-3xl">
              Häufige Fragen
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Ist Carcashflow kostenlos?",
                a: "Die ersten 30 Tage sind komplett kostenlos. Danach kannst du zwischen günstigen Abo-Optionen wählen.",
              },
              {
                q: "Wer kann die Plattform nutzen?",
                a: "Carcashflow ist exklusiv für Schulungsteilnehmer. Nur verifizierte Nutzer haben Zugang.",
              },
              {
                q: "Wie funktioniert die Kontaktaufnahme?",
                a: "Über unser internes Nachrichtensystem. Deine persönlichen Daten bleiben geschützt.",
              },
              {
                q: "Übernimmt Carcashflow Verantwortung für Fahrten?",
                a: "Nein, wir stellen nur die Plattform zur Kontaktanbahnung bereit. Absprachen erfolgen eigenverantwortlich.",
              },
            ].map((faq, index) => (
              <div key={index} className="border-b pb-6 last:border-0">
                <h3 className="font-medium mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="border-t px-6 py-20">
        <motion.div
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className="text-2xl font-medium md:text-3xl mb-4">
            Bereit loszufahren?
          </h2>
          <p className="text-muted-foreground mb-8">
            Registriere dich kostenlos und finde deine nächste Mitfahrgelegenheit.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto h-11 px-6">
                Kostenlos starten
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Keine Kreditkarte</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>30 Tage kostenlos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>DSGVO-konform</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span className="font-medium">Carcashflow</span>
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
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
              © {new Date().getFullYear()} Carcashflow
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
