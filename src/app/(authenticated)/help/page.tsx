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
  Mail,
  ExternalLink,
  Settings,
  Bell,
  User,
  MapPin,
  Calendar,
  Clock,
  Plus,
  Filter,
  Eye,
  Lock,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  BookOpen,
  Lightbulb,
  ArrowRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations"

// Documentation content for each section
const documentation = {
  overview: {
    title: "Übersicht",
    icon: BookOpen,
    content: `
      **Willkommen bei Carcashflow - deiner Mitfahrbörse für Schulungsteilnehmer!**

      Carcashflow ist eine Plattform für aktive Teilnehmer einer Schulung, um Rückfahrten effizient zu organisieren.
      Die Funktion dient ausschließlich der Kontaktanbahnung zwischen Mitgliedern.

      **Wichtiger Hinweis:** Es findet keine Vermittlung, Prüfung oder Haftung durch den Betreiber statt.
      Alle Absprachen erfolgen eigenverantwortlich zwischen den Nutzern.
    `,
    sections: [
      {
        title: "Schnellstart",
        content: `
          1. **Profil einrichten** - Vervollständige dein Profil mit Namen, Foto und Wohnort
          2. **Route erstellen** - Biete freie Plätze an oder suche eine Mitfahrgelegenheit
          3. **Kontakt aufnehmen** - Schreibe anderen Nutzern über das Nachrichtensystem
          4. **Absprachen treffen** - Kläre Details direkt mit deinem Fahrer/Mitfahrer
        `,
      },
      {
        title: "Die wichtigsten Bereiche",
        content: `
          - **Mitfahrbörse (Dashboard)** - Alle verfügbaren Fahrten und Gesuche
          - **Nachrichten** - Deine Konversationen mit anderen Nutzern
          - **Verbindungen** - Dein Netzwerk von vertrauenswürdigen Kontakten
          - **Einstellungen** - Profil, Account und Benachrichtigungen verwalten
        `,
      },
    ],
  },
  rides: {
    title: "Mitfahrbörse",
    icon: Car,
    content: `
      Die Mitfahrbörse ist das Herzstück von Carcashflow. Hier findest du alle aktiven Fahrten
      und kannst selbst Angebote oder Gesuche erstellen.
    `,
    sections: [
      {
        title: "Route erstellen",
        content: `
          **So erstellst du eine neue Route:**

          1. Klicke auf **"Route einstellen"** im Dashboard
          2. Wähle ob du **Plätze anbietest** oder **eine Mitfahrt suchst**
          3. Gib **Start- und Zieladresse** ein (Adressen werden automatisch vervollständigt)
          4. Optional: Füge **Zwischenstopps** hinzu (max. 3 zusätzliche Stopps)
          5. Wähle **Datum** und optional eine **Abfahrtszeit**
          6. Bei Angeboten: Gib die Anzahl der **freien Plätze** an
          7. Optional: Füge einen **Kommentar** hinzu

          **Tipps:**
          - Zwischenstopps können per Drag & Drop umsortiert werden
          - Die Route wird auf einer Karte visualisiert
          - Sei flexibel bei der Abfahrtszeit für mehr Matches
        `,
      },
      {
        title: "Fahrten finden",
        content: `
          **So findest du passende Fahrten:**

          - **Filter nutzen:** Filtere nach "Alle Routen", "Angebote" oder "Gesuche"
          - **Datum wählen:** Grenze die Suche auf bestimmte Tage ein
          - **Ortssuche:** Suche nach Start- oder Zielorten

          **Farbcodierung:**
          - 🟢 **Grün (Bietet Plätze)** - Der Nutzer bietet freie Plätze an
          - 🔵 **Blau (Sucht Mitfahrt)** - Der Nutzer sucht eine Mitfahrgelegenheit
        `,
      },
      {
        title: "Kontakt aufnehmen",
        content: `
          Hast du eine passende Fahrt gefunden?

          1. Klicke auf die **Fahrtkarte** für Details
          2. Klicke auf **"Kontakt aufnehmen"**
          3. Es wird automatisch eine Konversation erstellt
          4. Schreibe deine erste Nachricht

          **Bitte beachte:**
          - Keine öffentlichen Kontaktdaten in Fahrten angeben
          - Alle Kommunikation läuft über das interne Nachrichtensystem
        `,
      },
      {
        title: "Route bearbeiten & löschen",
        content: `
          Du kannst deine eigenen Routen jederzeit bearbeiten:

          - Klicke auf **"Bearbeiten"** bei deiner Route
          - Ändere Route, Datum oder andere Details
          - **Löschen:** Im Bearbeitungsdialog findest du auch die Option zum Löschen

          **Automatisches Ablaufen:**
          Routen laufen nach dem Abfahrtsdatum automatisch ab und werden nicht mehr angezeigt.
        `,
      },
    ],
  },
  messages: {
    title: "Nachrichten",
    icon: MessageSquare,
    content: `
      Das Nachrichtensystem ermöglicht sichere Kommunikation zwischen Nutzern,
      ohne dass persönliche Kontaktdaten öffentlich sichtbar sind.
    `,
    sections: [
      {
        title: "Konversationen",
        content: `
          **Nachrichtenübersicht:**
          - Alle deine Konversationen auf einen Blick
          - Ungelesene Nachrichten werden markiert
          - Klicke auf eine Konversation um sie zu öffnen

          **Neue Konversation:**
          Konversationen werden automatisch erstellt, wenn du bei einer Fahrt
          "Kontakt aufnehmen" klickst.
        `,
      },
      {
        title: "Benachrichtigungen",
        content: `
          Du wirst über neue Nachrichten informiert:

          - **In-App Badge:** Die Zahl ungelesener Nachrichten wird angezeigt
          - **E-Mail (Coming Soon):** Benachrichtigung per E-Mail

          Einstellungen für Benachrichtigungen findest du unter **Einstellungen > Benachrichtigungen**
        `,
      },
    ],
  },
  connections: {
    title: "Verbindungen",
    icon: Users,
    content: `
      Verbindungen sind wie Freundschaften innerhalb der Plattform.
      Vernetze dich mit anderen Schulungsteilnehmern, denen du vertraust.
    `,
    sections: [
      {
        title: "Verbindungsanfrage senden",
        content: `
          1. Besuche das **Profil** eines Nutzers
          2. Klicke auf **"Verbindung anfragen"**
          3. Der Nutzer erhält eine Benachrichtigung
          4. Sobald akzeptiert, seid ihr verbunden
        `,
      },
      {
        title: "Anfragen verwalten",
        content: `
          Unter **Verbindungen** siehst du:

          - **Ausstehende Anfragen** - Anfragen, die du verschickt hast
          - **Erhaltene Anfragen** - Anfragen, die du annehmen oder ablehnen kannst
          - **Deine Verbindungen** - Alle akzeptierten Verbindungen
        `,
      },
      {
        title: "Nutzer blockieren",
        content: `
          Wenn du einen Nutzer blockierst:

          - Kann er dir keine Nachrichten mehr senden
          - Kann er keine Verbindungsanfrage stellen
          - Sieht er dein Profil nicht mehr (wenn privat)

          **Blockieren:** Über das Menü im Nutzerprofil oder in der Konversation
        `,
      },
    ],
  },
  settings: {
    title: "Einstellungen",
    icon: Settings,
    content: `
      In den Einstellungen verwaltest du dein Profil, deinen Account und deine Präferenzen.
    `,
    sections: [
      {
        title: "Profil",
        content: `
          **Diese Informationen sind für andere sichtbar:**

          - **Profilbild** - Lade ein Foto hoch (max. 2MB, JPG/PNG/GIF)
          - **Name** - Vorname und Nachname
          - **Benutzername** - Deine eindeutige URL (carcashflow.de/u/deinname)
          - **Über mich** - Kurze Beschreibung (max. 500 Zeichen)
          - **Wohnort** - Hilft anderen bei der Einschätzung
          - **Telefon** - Optional, nur für verbundene Nutzer sichtbar
        `,
      },
      {
        title: "Account",
        content: `
          **Accounteinstellungen:**

          - **E-Mail ändern** - Deine Login-E-Mail-Adresse
          - **Passwort ändern** - Aus Sicherheitsgründen regelmäßig ändern
          - **Account löschen** - Unwiderrufliche Löschung aller Daten
        `,
      },
      {
        title: "Benachrichtigungen",
        content: `
          **Konfiguriere, wie du benachrichtigt wirst:**

          - **Neue Nachrichten** - Bei eingehenden Nachrichten
          - **Verbindungsanfragen** - Bei neuen Anfragen
          - **Passende Routen** - Wenn jemand eine passende Route erstellt (Coming Soon)

          **Kanäle:**
          - In-App Benachrichtigungen
          - E-Mail (Coming Soon)
        `,
      },
      {
        title: "Abonnement",
        content: `
          **Verwalte dein Abonnement:**

          - **Aktueller Plan** - Zeigt deinen aktiven Tarif
          - **Plan wechseln** - Upgrade oder Downgrade
          - **Zahlungsmethode** - Kreditkarte oder andere Methoden
          - **Rechnungen** - Alle vergangenen Zahlungen
          - **Kündigen** - Jederzeit zum Monatsende möglich

          **Promo Codes:** Gib einen Code ein, um Rabatte zu erhalten
        `,
      },
      {
        title: "Datenschutz",
        content: `
          **Kontrolliere deine Privatsphäre:**

          - **Profil-Sichtbarkeit** - Öffentlich oder nur für Verbindungen
          - **Online-Status** - Zeige wann du zuletzt aktiv warst
          - **Daten exportieren** - Lade alle deine Daten herunter (DSGVO)
        `,
      },
    ],
  },
  subscription: {
    title: "Abonnement & Preise",
    icon: CreditCard,
    content: `
      Carcashflow bietet verschiedene Tarife für unterschiedliche Bedürfnisse.
    `,
    sections: [
      {
        title: "Testphase",
        content: `
          **30 Tage kostenlos testen:**

          - Alle Features freigeschaltet
          - Keine Kreditkarte erforderlich
          - Automatische Erinnerung vor Ablauf

          Nach der Testphase kannst du einen bezahlten Plan wählen oder mit eingeschränktem Zugang weitermachen.
        `,
      },
      {
        title: "Verfügbare Pläne",
        content: `
          **Basis (4,99€/Monat):**
          - 20 Routen pro Monat
          - Unbegrenzte Nachrichten
          - 50 Verbindungen

          **Premium (9,99€/Monat):**
          - Unbegrenzte Routen
          - Unbegrenzte Verbindungen
          - Prioritäts-Support
          - Früher Zugang zu neuen Features

          **Lifetime (einmalig):**
          - Alle Premium-Features
          - Lebenslanger Zugang
        `,
      },
      {
        title: "Zahlungsmethoden",
        content: `
          Wir akzeptieren:

          - Kreditkarte (Visa, Mastercard, American Express)
          - SEPA-Lastschrift
          - PayPal

          Alle Zahlungen werden sicher über unseren Zahlungsdienstleister abgewickelt.
        `,
      },
      {
        title: "Kündigung & Erstattung",
        content: `
          - **Kündigung:** Jederzeit möglich, Zugang bis zum Ende der Laufzeit
          - **Erstattung:** Innerhalb von 14 Tagen nach Kauf
          - **Plan wechseln:** Upgrades sofort, Downgrades zum nächsten Abrechnungszeitraum
        `,
      },
    ],
  },
  privacy: {
    title: "Datenschutz & Sicherheit",
    icon: Shield,
    content: `
      Deine Sicherheit und Privatsphäre haben höchste Priorität.
    `,
    sections: [
      {
        title: "Deine Daten",
        content: `
          **Welche Daten speichern wir:**

          - Kontoinformationen (E-Mail, Name, Passwort verschlüsselt)
          - Profilinformationen (Foto, Bio, Wohnort)
          - Erstellte Routen und Nachrichten
          - Nutzungsstatistiken (anonymisiert)

          **Wir verkaufen keine Daten an Dritte.**
        `,
      },
      {
        title: "Datenlöschung",
        content: `
          Du kannst deine Daten jederzeit löschen:

          1. Gehe zu **Einstellungen > Account**
          2. Klicke auf **"Account löschen"**
          3. Bestätige mit deinem Passwort

          **Unwiderruflich:** Alle Daten werden permanent gelöscht.
        `,
      },
      {
        title: "Nutzer melden",
        content: `
          Wenn du unangemessenes Verhalten bemerkst:

          1. Öffne das Profil oder die Fahrt des Nutzers
          2. Klicke auf das **Drei-Punkte-Menü (⋯)**
          3. Wähle **"Melden"**
          4. Gib einen Grund an

          Unser Moderationsteam prüft alle Meldungen.
        `,
      },
      {
        title: "Sicherheitstipps",
        content: `
          **Schütze dich selbst:**

          - Teile keine sensiblen Daten öffentlich
          - Triff dich an öffentlichen Orten
          - Informiere jemanden über deine Fahrt
          - Vertraue deinem Bauchgefühl
          - Nutze das interne Nachrichtensystem
        `,
      },
    ],
  },
}

// FAQ data
const faqCategories = [
  {
    id: "general",
    title: "Allgemeine Fragen",
    questions: [
      {
        q: "Ist Carcashflow kostenlos?",
        a: "Du erhältst 30 Tage kostenlosen Zugang. Danach kannst du einen bezahlten Plan wählen oder mit eingeschränkten Funktionen weitermachen.",
      },
      {
        q: "Für wen ist Carcashflow gedacht?",
        a: "Carcashflow ist für aktive Schulungsteilnehmer, die gemeinsame Rückfahrten nach Fahrzeugüberführungen organisieren möchten.",
      },
      {
        q: "Übernimmt Carcashflow Verantwortung für die Fahrten?",
        a: "Nein, Carcashflow dient ausschließlich der Kontaktanbahnung. Es findet keine Vermittlung, Prüfung oder Haftung statt.",
      },
    ],
  },
  {
    id: "technical",
    title: "Technische Fragen",
    questions: [
      {
        q: "Welche Browser werden unterstützt?",
        a: "Carcashflow funktioniert am besten mit aktuellen Versionen von Chrome, Firefox, Safari und Edge.",
      },
      {
        q: "Gibt es eine App?",
        a: "Aktuell gibt es keine native App. Die Webseite ist jedoch für mobile Geräte optimiert.",
      },
      {
        q: "Wie kann ich mein Passwort zurücksetzen?",
        a: "Klicke auf 'Passwort vergessen' auf der Login-Seite und folge den Anweisungen in der E-Mail.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & Profil",
    questions: [
      {
        q: "Kann ich meinen Benutzernamen ändern?",
        a: "Ja, unter Einstellungen > Profil kannst du deinen Benutzernamen ändern (sofern verfügbar).",
      },
      {
        q: "Was passiert mit meinen Daten bei Kontolöschung?",
        a: "Alle deine Daten werden unwiderruflich gelöscht - Profil, Routen, Nachrichten und Verbindungen.",
      },
    ],
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  const filteredFaq = faqCategories
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0 || !searchQuery)

  const tabs = [
    { id: "overview", label: "Übersicht", icon: BookOpen },
    { id: "rides", label: "Mitfahrbörse", icon: Car },
    { id: "messages", label: "Nachrichten", icon: MessageSquare },
    { id: "connections", label: "Verbindungen", icon: Users },
    { id: "settings", label: "Einstellungen", icon: Settings },
    { id: "subscription", label: "Abonnement", icon: CreditCard },
    { id: "privacy", label: "Datenschutz", icon: Shield },
    { id: "faq", label: "FAQ", icon: HelpCircle },
  ]

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="w-full"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Hilfe & Dokumentation
        </h1>
        <p className="text-muted-foreground">
          Alles was du über Carcashflow wissen musst
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Suche in der Dokumentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-3 py-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Documentation Tabs */}
        {Object.entries(documentation).map(([key, doc]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <doc.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{doc.title}</CardTitle>
                    <CardDescription className="mt-1 whitespace-pre-line">
                      {doc.content.trim().split('\n').map((line, i) => (
                        <span key={i}>
                          {line.includes('**') ? (
                            <span dangerouslySetInnerHTML={{
                              __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }} />
                          ) : line}
                          <br />
                        </span>
                      ))}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {doc.sections.map((section, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {section.content.trim().split('\n').map((line, i) => {
                      const trimmedLine = line.trim()
                      if (!trimmedLine) return <br key={i} />

                      // Handle numbered lists
                      if (/^\d+\./.test(trimmedLine)) {
                        return (
                          <p key={i} className="flex gap-2 my-1">
                            <span dangerouslySetInnerHTML={{
                              __html: trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }} />
                          </p>
                        )
                      }

                      // Handle bullet points
                      if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                        return (
                          <p key={i} className="flex gap-2 my-1 ml-4">
                            <span>•</span>
                            <span dangerouslySetInnerHTML={{
                              __html: trimmedLine.slice(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }} />
                          </p>
                        )
                      }

                      // Regular text with bold support
                      return (
                        <p key={i} className="my-2" dangerouslySetInnerHTML={{
                          __html: trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        }} />
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Häufig gestellte Fragen</CardTitle>
                  <CardDescription>
                    Schnelle Antworten auf die wichtigsten Fragen
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {filteredFaq.map((category) => (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category.title}</CardTitle>
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
          ))}
        </TabsContent>
      </Tabs>

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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="mt-4 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Tipp des Tages</h4>
              <p className="text-sm text-muted-foreground">
                Vervollständige dein Profil mit einem Foto und deinem Wohnort.
                Das erhöht die Vertrauenswürdigkeit und führt zu mehr erfolgreichen Matches!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
