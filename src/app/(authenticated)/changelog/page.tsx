"use client"

import { motion } from "motion/react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Sparkles, Wrench, Bug, Rocket, Construction } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations"

interface ChangelogEntry {
  id: string
  date: Date
  version: string
  title: string
  description: string
  type: "feature" | "improvement" | "fix" | "announcement" | "wip"
  highlights?: string[]
}

const changelog: ChangelogEntry[] = [
  {
    id: "0",
    date: new Date("2026-01-13"),
    version: "0.9.0-beta",
    title: "Beta-Phase gestartet",
    description:
      "Carcashflow befindet sich aktuell in der geschlossenen Beta-Phase. Wir testen alle Features und sammeln Feedback vor dem offiziellen Launch.",
    type: "wip",
    highlights: [
      "Interne Tests laufen",
      "Feedback wird gesammelt",
      "Launch-Datum wird bekannt gegeben",
    ],
  },
  {
    id: "1",
    date: new Date("2026-01-13"),
    version: "0.9.0-beta",
    title: "Mitfahrbörse & Dashboard",
    description:
      "Das Herzstück der Plattform ist fertig: Erstelle Fahrtangebote oder Gesuche und finde passende Mitfahrer.",
    type: "feature",
    highlights: [
      "Angebote und Gesuche erstellen",
      "Filter nach Start, Ziel und Datum",
      "Detailansicht mit Kontaktmöglichkeit",
      "Automatische Ablauf-Markierung",
    ],
  },
  {
    id: "2",
    date: new Date("2026-01-13"),
    version: "0.9.0-beta",
    title: "Nachrichtensystem",
    description:
      "Kommuniziere direkt mit anderen Nutzern über das integrierte Nachrichtensystem.",
    type: "feature",
    highlights: [
      "Echtzeit-Nachrichten",
      "Konversationen pro Fahrt",
      "Ungelesen-Zähler",
      "Push-Benachrichtigungen (bald)",
    ],
  },
  {
    id: "3",
    date: new Date("2026-01-12"),
    version: "0.9.0-beta",
    title: "Verbindungen",
    description:
      "Vernetze dich mit anderen Nutzern und baue dein Netzwerk auf.",
    type: "feature",
    highlights: [
      "Verbindungsanfragen senden",
      "Anfragen akzeptieren/ablehnen",
      "Verbindungsliste verwalten",
    ],
  },
  {
    id: "4",
    date: new Date("2026-01-12"),
    version: "0.9.0-beta",
    title: "Profil & Einstellungen",
    description:
      "Personalisiere dein Profil und passe die App nach deinen Wünschen an.",
    type: "feature",
    highlights: [
      "Profilbild hochladen",
      "Öffentliches Profil",
      "Benachrichtigungs-Einstellungen",
      "Dark/Light Mode",
    ],
  },
  {
    id: "5",
    date: new Date("2026-01-12"),
    version: "0.9.0-beta",
    title: "Admin-Bereich",
    description:
      "Administratoren können die Plattform verwalten und moderieren.",
    type: "feature",
    highlights: [
      "Benutzerübersicht",
      "Meldungen bearbeiten",
      "Promo Codes erstellen",
      "Statistiken",
    ],
  },
]

const typeConfig = {
  feature: {
    icon: Sparkles,
    label: "Feature",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    dotColor: "bg-emerald-500",
  },
  improvement: {
    icon: Wrench,
    label: "Verbesserung",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    dotColor: "bg-blue-500",
  },
  fix: {
    icon: Bug,
    label: "Bugfix",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    dotColor: "bg-orange-500",
  },
  announcement: {
    icon: Rocket,
    label: "Ankündigung",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    dotColor: "bg-purple-500",
  },
  wip: {
    icon: Construction,
    label: "In Arbeit",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    dotColor: "bg-amber-500",
  },
}

export default function ChangelogPage() {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="w-full"
    >
      {/* Header */}
      <div className="mb-10">
        <Badge variant="secondary" className="mb-3">
          Was gibt's Neues?
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
        <p className="text-muted-foreground mt-2">
          Verfolge die Entwicklung von Carcashflow
        </p>
      </div>

      {/* Timeline */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="relative"
      >
        {/* Timeline Line - hinter den Icons */}
        <div className="absolute left-5 top-5 bottom-5 w-px bg-border -z-10" />

        <div className="space-y-6">
          {changelog.map((entry, index) => {
            const config = typeConfig[entry.type]
            const Icon = config.icon
            const isFirst = index === 0

            return (
              <motion.div
                key={entry.id}
                variants={staggerItem}
                className="relative pl-14"
              >
                {/* Timeline Dot mit solidem Hintergrund */}
                <div
                  className={cn(
                    "absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background",
                    config.dotColor,
                    isFirst && "ring-4 ring-amber-500/20"
                  )}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>

                <Card className={cn(
                  "overflow-hidden transition-all hover:shadow-md",
                  isFirst && "border-amber-500/50 bg-amber-500/5"
                )}>
                  <CardContent className="pt-5 pb-5">
                    {/* Meta Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {entry.version}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(entry.date, "d. MMM yyyy", { locale: de })}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-semibold mb-1.5">{entry.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {entry.description}
                    </p>

                    {/* Highlights */}
                    {entry.highlights && entry.highlights.length > 0 && (
                      <ul className="grid gap-1.5">
                        {entry.highlights.map((highlight, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2.5 text-sm"
                          >
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              config.dotColor
                            )} />
                            <span className="text-muted-foreground">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t text-center">
        <p className="text-sm text-muted-foreground">
          Hast du Ideen oder Feedback?{" "}
          <a
            href="mailto:feedback@carcashflow.de"
            className="text-primary hover:underline"
          >
            Schreib uns!
          </a>
        </p>
      </div>
    </motion.div>
  )
}
