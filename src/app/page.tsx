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
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  staggerContainer,
  staggerItem,
  fadeIn,
  fadeInUp,
} from "@/lib/animations"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container flex h-16 items-center justify-between px-4">
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
      <section className="relative flex flex-1 flex-col items-center justify-center px-4 py-20 md:py-32 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-offer/5 via-background to-request/5" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-offer/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-request/10 rounded-full blur-3xl" />
        </div>

        {/* Animated Dots Pattern */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mx-auto max-w-4xl space-y-8 text-center"
        >
          {/* Badge */}
          <motion.div variants={staggerItem}>
            <Badge
              variant="secondary"
              className="px-4 py-1.5 text-sm font-medium border border-border/50"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5 text-offer" />
              30 Tage kostenlos testen
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={staggerItem}
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Mitfahrbörse für{" "}
            <span className="bg-gradient-to-r from-offer to-request bg-clip-text text-transparent">
              Schulungsteilnehmer
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={staggerItem}
            className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            Organisiere Rückfahrten effizient mit anderen Teilnehmern.
            Biete Fahrten an, finde Mitfahrgelegenheiten und spare Kosten.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={staggerItem}
            className="flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-8 text-base bg-gradient-to-r from-offer to-request text-white hover:opacity-90 transition-opacity shadow-lg shadow-offer/25"
              >
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 text-base"
              >
                Ich habe bereits ein Konto
              </Button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={staggerItem}
            className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground"
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

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container px-4">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {[
              { value: "100%", label: "Kostenlos im ersten Monat" },
              { value: "24/7", label: "Verfügbarkeit" },
              { value: "< 5 Min", label: "Eintrag erstellen" },
              { value: "Sicher", label: "Verifizierte Nutzer" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="text-center"
              >
                <p className="text-3xl font-bold md:text-4xl bg-gradient-to-r from-offer to-request bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <motion.div
            variants={fadeIn}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="mx-auto max-w-2xl text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">
              So funktioniert&apos;s
            </Badge>
            <h2 className="text-3xl font-bold md:text-4xl">
              In drei Schritten zur Mitfahrt
            </h2>
            <p className="mt-4 text-muted-foreground">
              Einfacher geht&apos;s nicht: Registrieren, Eintrag erstellen,
              Kontakt aufnehmen.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3"
          >
            {[
              {
                step: "01",
                icon: MapPin,
                title: "Route angeben",
                description:
                  "Gib deinen Start- und Zielort an. Füge Zwischenstopps hinzu, wenn du auf dem Weg jemanden mitnehmen kannst.",
                color: "offer",
              },
              {
                step: "02",
                icon: Users,
                title: "Kontakt aufnehmen",
                description:
                  "Finde passende Angebote oder Gesuche und nimm direkt Kontakt mit anderen Teilnehmern auf.",
                color: "request",
              },
              {
                step: "03",
                icon: Shield,
                title: "Sicher & einfach",
                description:
                  "Nur verifizierte Schulungsteilnehmer. Deine Kontaktdaten bleiben privat bis du sie teilen möchtest.",
                color: "primary",
              },
            ].map((item, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Card className="group relative h-full overflow-hidden border-2 transition-colors hover:border-offer/50">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                    item.color === "offer"
                      ? "from-offer to-offer/50"
                      : item.color === "request"
                      ? "from-request to-request/50"
                      : "from-primary to-primary/50"
                  }`} />
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        item.color === "offer"
                          ? "bg-offer/10"
                          : item.color === "request"
                          ? "bg-request/10"
                          : "bg-primary/10"
                      }`}>
                        <item.icon className={`h-6 w-6 ${
                          item.color === "offer"
                            ? "text-offer"
                            : item.color === "request"
                            ? "text-request"
                            : "text-primary"
                        }`} />
                      </div>
                      <span className="text-4xl font-bold text-muted-foreground/20">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container px-4">
          <motion.div
            variants={fadeIn}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="mx-auto max-w-2xl text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl font-bold md:text-4xl">
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
            className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3"
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
                icon: Clock,
                title: "Flexible Zeiten",
                description: "Morgens, mittags oder abends - finde immer eine passende Fahrt.",
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
            ].map((feature, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-offer/10 to-request/10 mb-4">
                      <feature.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-offer via-offer/80 to-request" />

            {/* Content */}
            <div className="relative px-8 py-16 md:px-16 md:py-20 text-center text-white">
              <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl mb-4">
                Bereit loszufahren?
              </h2>
              <p className="mx-auto max-w-xl text-white/90 mb-8 text-lg">
                Registriere dich jetzt kostenlos und finde deine nächste
                Mitfahrgelegenheit. Der erste Monat ist komplett gratis.
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base bg-white text-foreground hover:bg-white/90 shadow-xl"
                >
                  Jetzt kostenlos registrieren
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container px-4">
          <motion.div
            variants={fadeIn}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="mx-auto max-w-2xl text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold md:text-4xl">
              Häufig gestellte Fragen
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="mx-auto max-w-3xl space-y-4"
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
              <motion.div key={index} variants={staggerItem}>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container px-4">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
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
              &copy; {new Date().getFullYear()} Carcashflow. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
