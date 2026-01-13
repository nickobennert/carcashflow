"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  Search,
  HelpCircle,
  MessageSquare,
  Car,
  Users,
  CreditCard,
  Shield,
  Mail,
  Settings,
  BookOpen,
  Lightbulb,
  ArrowRight,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  Play,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations"

// Quick Start Steps
const quickStartSteps = [
  {
    step: "01",
    title: "Profil einrichten",
    description: "Vervollständige dein Profil mit Namen, Foto und Wohnort",
    icon: Settings,
    color: "offer",
  },
  {
    step: "02",
    title: "Route erstellen",
    description: "Biete freie Plätze an oder suche eine Mitfahrgelegenheit",
    icon: MapPin,
    color: "request",
  },
  {
    step: "03",
    title: "Kontakt aufnehmen",
    description: "Schreibe anderen Nutzern über das Nachrichtensystem",
    icon: MessageSquare,
    color: "primary",
  },
]

// Feature guides
const featureGuides = [
  {
    id: "rides",
    title: "Mitfahrbörse",
    description: "Fahrten erstellen, finden und verwalten",
    icon: Car,
    color: "offer",
    features: [
      "Route mit Start, Ziel und Zwischenstopps erstellen",
      "Filter nach Datum, Typ und Ort",
      "Farbcodierung: Grün = Bietet, Blau = Sucht",
      "Automatisches Ablaufen nach Fahrtdatum",
    ],
  },
  {
    id: "messages",
    title: "Nachrichten",
    description: "Sichere Kommunikation mit anderen Nutzern",
    icon: MessageSquare,
    color: "request",
    features: [
      "Internes Nachrichtensystem ohne Telefonnummern",
      "Konversationen zu Fahrten verknüpft",
      "Ungelesene Nachrichten werden markiert",
      "Benachrichtigungen bei neuen Nachrichten",
    ],
  },
  {
    id: "connections",
    title: "Verbindungen",
    description: "Vernetze dich mit vertrauenswürdigen Kontakten",
    icon: Users,
    color: "primary",
    features: [
      "Verbindungsanfragen senden und empfangen",
      "Erweiterte Profilinformationen für Verbindungen",
      "Nutzer blockieren bei Problemen",
      "Übersicht aller deiner Verbindungen",
    ],
  },
  {
    id: "settings",
    title: "Einstellungen",
    description: "Profil, Account und Präferenzen verwalten",
    icon: Settings,
    color: "muted",
    features: [
      "Profilbild und Informationen bearbeiten",
      "E-Mail und Passwort ändern",
      "Benachrichtigungen konfigurieren",
      "Abonnement und Zahlungen verwalten",
    ],
  },
]

// FAQ data
const faqData = [
  {
    q: "Ist Carcashflow kostenlos?",
    a: "Du erhältst 30 Tage kostenlosen Zugang mit allen Features. Danach kannst du einen günstigen Abo-Plan wählen.",
  },
  {
    q: "Für wen ist Carcashflow gedacht?",
    a: "Carcashflow ist exklusiv für Schulungsteilnehmer, die gemeinsame Rückfahrten organisieren möchten.",
  },
  {
    q: "Übernimmt Carcashflow Verantwortung?",
    a: "Nein, Carcashflow dient nur der Kontaktanbahnung. Absprachen erfolgen eigenverantwortlich zwischen den Nutzern.",
  },
  {
    q: "Wie kann ich mein Passwort zurücksetzen?",
    a: "Klicke auf 'Passwort vergessen' auf der Login-Seite und folge den Anweisungen in der E-Mail.",
  },
  {
    q: "Gibt es eine App?",
    a: "Aktuell gibt es keine native App. Die Webseite ist jedoch für mobile Geräte optimiert und funktioniert wie eine App.",
  },
  {
    q: "Wie lösche ich meinen Account?",
    a: "Unter Einstellungen > Account findest du die Option 'Account löschen'. Alle Daten werden dann permanent gelöscht.",
  },
]

// Tips
const tips = [
  {
    icon: Lightbulb,
    title: "Profil vervollständigen",
    description: "Ein vollständiges Profil mit Foto erhöht deine Erfolgschancen um 80%.",
  },
  {
    icon: Clock,
    title: "Flexibel sein",
    description: "Gib bei der Abfahrtszeit 'flexibel' an für mehr potenzielle Matches.",
  },
  {
    icon: Shield,
    title: "Sicherheit",
    description: "Teile keine sensiblen Daten öffentlich und triff dich an öffentlichen Orten.",
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null)

  const filteredFaq = faqData.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="w-full max-w-6xl mx-auto"
    >
      {/* Hero Header */}
      <div className="relative mb-12 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-offer/20 via-background to-request/20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-offer/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-request/10 rounded-full blur-3xl" />

        <div className="relative px-6 py-12 md:px-12 md:py-16 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">
              <BookOpen className="mr-2 h-3.5 w-3.5" />
              Hilfe-Center
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            Wie können wir{" "}
            <span className="bg-gradient-to-r from-offer to-request bg-clip-text text-transparent">
              helfen
            </span>
            ?
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-xl mx-auto mb-8"
          >
            Finde schnell Antworten auf deine Fragen oder durchsuche unsere Anleitungen
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-md mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Suche nach Antworten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base bg-background/80 backdrop-blur border-border/50"
            />
          </motion.div>
        </div>
      </div>

      {/* Quick Start */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-offer to-request">
            <Play className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl font-semibold">Schnellstart</h2>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid gap-4 md:grid-cols-3"
        >
          {quickStartSteps.map((step, index) => (
            <motion.div key={index} variants={staggerItem}>
              <Card className="h-full group hover:shadow-md transition-shadow border-2 hover:border-offer/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      step.color === "offer"
                        ? "bg-offer/10"
                        : step.color === "request"
                        ? "bg-request/10"
                        : "bg-primary/10"
                    }`}>
                      <step.icon className={`h-6 w-6 ${
                        step.color === "offer"
                          ? "text-offer"
                          : step.color === "request"
                          ? "text-request"
                          : "text-primary"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold text-muted-foreground/20">{step.step}</span>
                      </div>
                      <h3 className="font-semibold mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Feature Guides */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Anleitungen</h2>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid gap-4 md:grid-cols-2"
        >
          {featureGuides.map((guide, index) => (
            <motion.div key={guide.id} variants={staggerItem}>
              <Card
                className={`h-full cursor-pointer transition-all hover:shadow-md ${
                  expandedGuide === guide.id ? "ring-2 ring-offer" : ""
                }`}
                onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        guide.color === "offer"
                          ? "bg-offer/10"
                          : guide.color === "request"
                          ? "bg-request/10"
                          : guide.color === "primary"
                          ? "bg-primary/10"
                          : "bg-muted"
                      }`}>
                        <guide.icon className={`h-5 w-5 ${
                          guide.color === "offer"
                            ? "text-offer"
                            : guide.color === "request"
                            ? "text-request"
                            : guide.color === "primary"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{guide.title}</CardTitle>
                        <CardDescription className="text-sm">{guide.description}</CardDescription>
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${
                      expandedGuide === guide.id ? "rotate-90" : ""
                    }`} />
                  </div>
                </CardHeader>

                {expandedGuide === guide.id && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <ul className="space-y-3">
                      {guide.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-4 w-4 text-offer shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Pro Tips */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
            <Sparkles className="h-4 w-4 text-warning" />
          </div>
          <h2 className="text-xl font-semibold">Pro-Tipps</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {tips.map((tip, index) => (
            <Card key={index} className="bg-gradient-to-br from-muted/50 to-muted/30 border-0">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                    <tip.icon className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1">{tip.title}</h3>
                    <p className="text-xs text-muted-foreground">{tip.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-request/10">
              <HelpCircle className="h-4 w-4 text-request" />
            </div>
            <h2 className="text-xl font-semibold">Häufige Fragen</h2>
          </div>
          {searchQuery && (
            <Badge variant="secondary">
              {filteredFaq.length} Ergebnis{filteredFaq.length !== 1 ? "se" : ""}
            </Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              {filteredFaq.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="border-b last:border-0"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-muted/50">
                    <span className="font-medium">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredFaq.length === 0 && (
              <div className="p-8 text-center">
                <HelpCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Keine Ergebnisse für &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Contact CTA */}
      <section className="mb-8">
        <Card className="overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-offer/10 via-transparent to-request/10" />
            <CardContent className="relative p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-semibold mb-2">
                    Keine Antwort gefunden?
                  </h3>
                  <p className="text-muted-foreground">
                    Unser Support-Team hilft dir gerne persönlich weiter
                  </p>
                </div>
                <Button asChild size="lg" className="bg-gradient-to-r from-offer to-request text-white hover:opacity-90">
                  <a href="mailto:support@carcashflow.de">
                    <Mail className="h-4 w-4 mr-2" />
                    Support kontaktieren
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </section>

      {/* Quick Links */}
      <section>
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/settings">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-sm">Einstellungen</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/pricing">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-sm">Preise & Pläne</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/changelog">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-sm">Was ist neu?</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </motion.div>
  )
}
