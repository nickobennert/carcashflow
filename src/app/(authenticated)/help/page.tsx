"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  Search,
  HelpCircle,
  Mail,
  Settings,
  Lightbulb,
  ArrowRight,
  Clock,
  Shield,
  Sparkles,
  Scale,
  Car,
  MessageSquare,
  MapPin,
  Bell,
  UserCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { fadeIn } from "@/lib/animations"

// FAQ data - aktualisiert für aktuellen Stand
const faqData = [
  {
    q: "Was ist Fahr mit!?",
    a: "Fahr mit! ist eine Mitfahrbörse speziell für Schulungsteilnehmer. Du kannst Fahrten anbieten oder suchen und dich mit anderen Teilnehmern vernetzen.",
  },
  {
    q: "Ist Fahr mit! kostenlos?",
    a: "Ja, Fahr mit! ist komplett kostenlos nutzbar. Es gibt keine versteckten Kosten oder Abo-Modelle.",
  },
  {
    q: "Für wen ist Fahr mit! gedacht?",
    a: "Fahr mit! ist exklusiv für aktive Schulungsteilnehmer, die gemeinsame Rückfahrten organisieren möchten.",
  },
  {
    q: "Übernimmt Fahr mit! Verantwortung?",
    a: "Nein, Fahr mit! dient nur der Kontaktanbahnung. Absprachen erfolgen eigenverantwortlich zwischen den Nutzern. Wir übernehmen keine Vermittlung oder Haftung.",
  },
  {
    q: "Wie erstelle ich eine Fahrt?",
    a: "Klicke im Dashboard auf 'Neue Fahrt' und gib Start, Ziel, Datum und Anzahl der Plätze an. Du kannst wählen, ob du Plätze anbietest oder eine Mitfahrgelegenheit suchst.",
  },
  {
    q: "Wie kontaktiere ich andere Nutzer?",
    a: "Klicke bei einer Fahrt auf 'Kontakt aufnehmen'. Das öffnet eine Konversation im internen Nachrichtensystem - deine Telefonnummer bleibt privat.",
  },
  {
    q: "Was sind Routen-Benachrichtigungen?",
    a: "Du kannst Routen oder Orte speichern und wirst automatisch benachrichtigt, wenn neue passende Fahrten erstellt werden. Einstellbar unter Dashboard > Benachrichtigungen.",
  },
  {
    q: "Wie kann ich mein Passwort zurücksetzen?",
    a: "Klicke auf 'Passwort vergessen' auf der Login-Seite und folge den Anweisungen in der E-Mail.",
  },
  {
    q: "Kann ich wiederkehrende Fahrten erstellen?",
    a: "Ja! Beim Erstellen einer Fahrt kannst du 'Wiederkehrend' aktivieren und die Wochentage auswählen. Die Fahrt wird dann automatisch für den gewählten Zeitraum erstellt.",
  },
  {
    q: "Wie lösche ich meinen Account?",
    a: "Unter Einstellungen > Account findest du die Option 'Account löschen'. Alle Daten werden dann permanent gelöscht (DSGVO-konform).",
  },
  {
    q: "Kann ich meine Daten exportieren?",
    a: "Ja, unter Einstellungen > Datenschutz kannst du alle deine Daten als JSON-Datei herunterladen (DSGVO Art. 20).",
  },
  {
    q: "Gibt es eine App?",
    a: "Aktuell gibt es keine native App. Die Webseite ist jedoch für mobile Geräte optimiert und funktioniert wie eine App.",
  },
]

// Tips
const tips = [
  {
    icon: Lightbulb,
    title: "Profil vervollständigen",
    description: "Ein vollständiges Profil mit Foto erhöht deine Erfolgschancen.",
  },
  {
    icon: Clock,
    title: "Flexibel sein",
    description: "Gib bei der Abfahrtszeit 'flexibel' an für mehr potenzielle Matches.",
  },
  {
    icon: Shield,
    title: "Sicherheit",
    description: "Teile keine sensiblen Daten und triff dich an öffentlichen Orten.",
  },
  {
    icon: Bell,
    title: "Benachrichtigungen nutzen",
    description: "Aktiviere Routen-Benachrichtigungen um keine passende Fahrt zu verpassen.",
  },
]

// Features
const features = [
  {
    icon: Car,
    title: "Fahrten erstellen",
    description: "Biete freie Plätze an oder suche nach Mitfahrgelegenheiten.",
  },
  {
    icon: MapPin,
    title: "Intelligentes Matching",
    description: "Finde Fahrten die auf deiner Route liegen - auch mit Umwegen.",
  },
  {
    icon: MessageSquare,
    title: "Internes Messaging",
    description: "Sichere Kommunikation ohne Telefonnummer-Austausch.",
  },
  {
    icon: Bell,
    title: "Routen-Benachrichtigungen",
    description: "Werde informiert wenn neue passende Fahrten erstellt werden.",
  },
  {
    icon: UserCircle,
    title: "Nutzerprofile",
    description: "Lerne andere Teilnehmer kennen bevor du mitfährst.",
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")

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
      className="w-full max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="mb-12 text-center">
        <p className="mb-2 text-sm text-muted-foreground">Hilfe-Center</p>
        <h1 className="text-3xl font-medium tracking-tight mb-4">
          Wie können wir helfen?
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto mb-8">
          Finde schnell Antworten auf deine Fragen
        </p>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Antworten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11"
          />
        </div>
      </div>

      {/* Features */}
      <section className="mb-12">
        <p className="mb-4 text-sm text-muted-foreground">Features</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-3 p-4 rounded-lg border bg-card">
              <feature.icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="mb-12">
        <p className="mb-4 text-sm text-muted-foreground">Tipps</p>
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <div key={index} className="flex gap-4">
              <tip.icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">{tip.title}</h3>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">Häufige Fragen</p>
          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              {filteredFaq.length} Ergebnis{filteredFaq.length !== 1 ? "se" : ""}
            </p>
          )}
        </div>

        <Accordion type="single" collapsible className="w-full">
          {filteredFaq.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border-b last:border-0"
            >
              <AccordionTrigger className="py-4 text-left hover:no-underline">
                <span className="font-medium">{faq.q}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredFaq.length === 0 && (
          <div className="py-12 text-center">
            <HelpCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Keine Ergebnisse für &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </section>

      {/* Contact */}
      <section className="mb-12 border-t pt-12">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Keine Antwort gefunden?</h2>
          <p className="text-muted-foreground mb-6">
            Unser Support-Team hilft dir gerne persönlich weiter
          </p>
          <Button asChild>
            <a href="mailto:support@fahrmit.de">
              <Mail className="h-4 w-4 mr-2" />
              Support kontaktieren
            </a>
          </Button>
        </div>
      </section>

      {/* Quick Links */}
      <section className="border-t pt-8">
        <p className="mb-4 text-sm text-muted-foreground">Schnellzugriff</p>
        <div className="space-y-2">
          <Link
            href="/settings"
            className="flex items-center justify-between py-3 border-b hover:text-foreground text-muted-foreground transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              <span className="text-sm">Einstellungen</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/changelog"
            className="flex items-center justify-between py-3 border-b hover:text-foreground text-muted-foreground transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">Was ist neu?</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/datenschutz"
            className="flex items-center justify-between py-3 border-b hover:text-foreground text-muted-foreground transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Datenschutzerklärung</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/impressum"
            className="flex items-center justify-between py-3 hover:text-foreground text-muted-foreground transition-colors"
          >
            <div className="flex items-center gap-3">
              <Scale className="h-4 w-4" />
              <span className="text-sm">Impressum</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </motion.div>
  )
}
