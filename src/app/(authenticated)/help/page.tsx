"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Search,
  HelpCircle,
  Mail,
  Bug,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fadeIn } from "@/lib/animations"
import { BugReportModal } from "@/components/help/bug-report-modal"

// FAQ data
const faqData = [
  {
    q: "Was ist Fahr mit!?",
    a: "Fahr mit! ist eine Mitfahrbörse speziell für Schulungsteilnehmer. Du kannst Fahrten anbieten oder suchen und dich mit anderen Teilnehmern vernetzen.",
  },
  {
    q: "Ist Fahr mit! kostenlos?",
    a: "Fahr mit! befindet sich aktuell in der Beta-Phase und ist in dieser Zeit kostenlos nutzbar. Nach Abschluss der Beta wird die App kostenpflichtig — aktuelle Beta-Nutzer werden rechtzeitig informiert.",
  },
  {
    q: "Was passiert nach der Beta-Phase?",
    a: "Nach der Beta-Phase wird Fahr mit! in ein Abo-Modell übergehen. Du wirst rechtzeitig über die verfügbaren Pläne und Preise informiert. Beta-Nutzer erhalten dabei besondere Konditionen als Dankeschön für ihr frühes Vertrauen.",
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

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [bugReportOpen, setBugReportOpen] = useState(false)

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
      className="w-full"
    >
      {/* Header */}
      <div className="mb-8">
        <p className="mb-2 text-sm text-muted-foreground">Hilfe-Center</p>
        <h1 className="text-3xl font-medium tracking-tight mb-2">
          Wie können wir helfen?
        </h1>
        <p className="text-muted-foreground">
          Finde schnell Antworten auf deine Fragen oder kontaktiere uns
        </p>
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - FAQ */}
        <div className="lg:col-span-2">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suche nach Antworten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* FAQ */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">Häufige Fragen</p>
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
              <div className="py-12 text-center border rounded-lg">
                <HelpCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Keine Ergebnisse für &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Support & Bug Report */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Support kontaktieren
              </CardTitle>
              <CardDescription>
                Unser Team hilft dir gerne bei Fragen weiter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href="mailto:info@carcashflow.de">
                  E-Mail schreiben
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                info@carcashflow.de
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Bug melden
              </CardTitle>
              <CardDescription>
                Du hast einen Fehler gefunden? Hilf uns die App zu verbessern
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setBugReportOpen(true)}
              >
                Fehler melden
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bug Report Modal */}
      <BugReportModal
        open={bugReportOpen}
        onOpenChange={setBugReportOpen}
      />
    </motion.div>
  )
}
