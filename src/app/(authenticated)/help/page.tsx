"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Search,
  HelpCircle,
  MessageSquare,
  Car,
  Users,
  CreditCard,
  Shield,
  ChevronDown,
  Mail,
  ExternalLink,
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
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations"

const categories = [
  {
    id: "getting-started",
    title: "Erste Schritte",
    icon: HelpCircle,
    questions: [
      {
        q: "Wie erstelle ich ein Konto?",
        a: "Klicke auf 'Registrieren' auf der Startseite und fülle das Formular aus. Du erhältst eine Bestätigungs-E-Mail.",
      },
      {
        q: "Wie vervollständige ich mein Profil?",
        a: "Gehe zu Einstellungen > Profil und fülle alle Felder aus. Ein vollständiges Profil erhöht deine Vertrauenswürdigkeit.",
      },
      {
        q: "Wie funktioniert die Testphase?",
        a: "Neue Nutzer erhalten 30 Tage kostenlosen Zugang zu allen Features. Nach Ablauf kannst du einen bezahlten Plan wählen.",
      },
    ],
  },
  {
    id: "rides",
    title: "Fahrten",
    icon: Car,
    questions: [
      {
        q: "Wie erstelle ich ein Fahrtangebot?",
        a: "Klicke auf 'Neue Fahrt' im Dashboard, wähle 'Biete Fahrt an', gib Start, Ziel und Datum ein.",
      },
      {
        q: "Wie suche ich eine Fahrt?",
        a: "Nutze die Filter im Dashboard um nach Start, Ziel und Datum zu filtern. Du kannst auch ein Gesuch erstellen.",
      },
      {
        q: "Wie kontaktiere ich einen Fahrer?",
        a: "Klicke auf eine Fahrt und dann auf 'Kontakt aufnehmen'. Es wird eine Konversation erstellt.",
      },
      {
        q: "Wie lange sind Fahrten sichtbar?",
        a: "Fahrten werden nach dem Abfahrtsdatum automatisch als abgelaufen markiert.",
      },
    ],
  },
  {
    id: "messages",
    title: "Nachrichten",
    icon: MessageSquare,
    questions: [
      {
        q: "Wo finde ich meine Nachrichten?",
        a: "Klicke auf das Nachrichten-Symbol in der Navigation oder gehe zu 'Nachrichten' in der Seitenleiste.",
      },
      {
        q: "Bekomme ich Benachrichtigungen bei neuen Nachrichten?",
        a: "Ja, du erhältst Push- und E-Mail-Benachrichtigungen. Diese kannst du in den Einstellungen anpassen.",
      },
    ],
  },
  {
    id: "connections",
    title: "Verbindungen",
    icon: Users,
    questions: [
      {
        q: "Was sind Verbindungen?",
        a: "Verbindungen sind wie Freundschaften. Du kannst anderen Nutzern eine Verbindungsanfrage senden.",
      },
      {
        q: "Wie sende ich eine Verbindungsanfrage?",
        a: "Besuche das Profil eines Nutzers und klicke auf 'Verbinden'. Der Nutzer muss die Anfrage akzeptieren.",
      },
      {
        q: "Kann ich Nutzer blockieren?",
        a: "Ja, du kannst unerwünschte Nutzer blockieren. Blockierte Nutzer können dich nicht mehr kontaktieren.",
      },
    ],
  },
  {
    id: "subscription",
    title: "Abonnement",
    icon: CreditCard,
    questions: [
      {
        q: "Welche Zahlungsmethoden werden akzeptiert?",
        a: "Wir akzeptieren Kreditkarten, SEPA-Lastschrift und PayPal über unseren Zahlungsdienstleister Stripe.",
      },
      {
        q: "Kann ich mein Abo kündigen?",
        a: "Ja, jederzeit. Gehe zu Einstellungen > Abonnement > 'Abonnement verwalten'. Du behältst Zugang bis zum Ende der Laufzeit.",
      },
      {
        q: "Was passiert nach der Testphase?",
        a: "Nach 30 Tagen wird der Zugang eingeschränkt. Du kannst dann einen Plan wählen oder mit eingeschränkten Funktionen weitermachen.",
      },
      {
        q: "Wie löse ich einen Promo Code ein?",
        a: "Gehe zu Einstellungen > Abonnement oder zur Pricing-Seite und gib deinen Code im Feld 'Promo Code einlösen' ein.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Datenschutz & Sicherheit",
    icon: Shield,
    questions: [
      {
        q: "Wer kann mein Profil sehen?",
        a: "Standardmäßig ist dein Profil öffentlich. Du kannst es in den Einstellungen auf privat stellen.",
      },
      {
        q: "Wie lösche ich mein Konto?",
        a: "Gehe zu Einstellungen > Account > 'Account löschen'. Alle deine Daten werden unwiderruflich gelöscht.",
      },
      {
        q: "Wie melde ich einen Nutzer?",
        a: "Klicke auf das Drei-Punkte-Menü im Profil oder bei einer Fahrt und wähle 'Melden'.",
      },
    ],
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0 || !searchQuery)

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Wie können wir helfen?
        </h1>
        <p className="text-muted-foreground">
          Durchsuche unsere FAQ oder kontaktiere uns direkt
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Suche nach Fragen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {filteredCategories.map((category) => {
          const Icon = category.icon

          return (
            <motion.div key={category.id} variants={staggerItem}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((q, i) => (
                      <AccordionItem key={i} value={`${category.id}-${i}`}>
                        <AccordionTrigger className="text-left hover:no-underline">
                          {q.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {q.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Contact Section */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Keine Antwort gefunden?
            </h3>
            <p className="text-muted-foreground mb-4">
              Unser Support-Team hilft dir gerne weiter
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <a href="mailto:support@carcashflow.de">
                  <Mail className="h-4 w-4 mr-2" />
                  E-Mail schreiben
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://docs.carcashflow.de"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Dokumentation
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
