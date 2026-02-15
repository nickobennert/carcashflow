"use client"

import { useState, useEffect, ReactNode } from "react"
import { motion } from "motion/react"
import Image from "next/image"
import {
  Book,
  Code,
  Database,
  MessageSquare,
  Car,
  Bell,
  Shield,
  Server,
  Sparkles,
  ChevronUp,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Terminal,
  Folder,
  FileCode,
  Zap,
  Globe,
  Lock,
  Bug,
  Settings,
  Users,
  Route,
  Eye,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ─── Reusable Components ────────────────────────────────────────────

function Section({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      {children}
    </section>
  )
}

function SectionTitle({ number, children }: { number: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6 mt-16 first:mt-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
        {number}
      </span>
      <h2 className="text-2xl font-bold tracking-tight">{children}</h2>
    </div>
  )
}

function SubTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold mt-8 mb-3">{children}</h3>
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground leading-7 mb-4">{children}</p>
}

function StatusBadge({ status }: { status: "active" | "disabled" | "planned" }) {
  if (status === "active") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Aktiv
      </Badge>
    )
  }
  if (status === "disabled") {
    return (
      <Badge variant="secondary" className="text-orange-500 border-orange-500/20">
        <XCircle className="h-3 w-3 mr-1" />
        Deaktiviert
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Clock className="h-3 w-3 mr-1" />
      Geplant
    </Badge>
  )
}

function InfoCard({ icon: Icon, title, children, className }: { icon: React.ComponentType<{ className?: string }>; title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-5", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  )
}

function CodeBlock({ language, title, children }: { language: string; title?: string; children: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-4 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-500 font-mono">{title || language}</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {/* Code content */}
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-zinc-300 leading-relaxed">{children}</code>
      </pre>
    </div>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | ReactNode)[][] }) {
  return (
    <div className="my-4 rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((h, i) => (
              <th key={i} className="text-left p-3 font-semibold text-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="p-3 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FlowStep({ number, children }: { number: number; children: ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
        {number}
      </span>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  )
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">{children}</code>
  )
}

function Callout({ type = "info", children }: { type?: "info" | "warning" | "success"; children: ReactNode }) {
  const styles = {
    info: "border-blue-500/20 bg-blue-500/5 text-blue-200",
    warning: "border-orange-500/20 bg-orange-500/5 text-orange-200",
    success: "border-emerald-500/20 bg-emerald-500/5 text-emerald-200",
  }
  return (
    <div className={cn("rounded-lg border p-4 my-4 text-sm leading-relaxed", styles[type])}>
      {children}
    </div>
  )
}

// ─── Table of Contents ──────────────────────────────────────────────

const tableOfContents = [
  { id: "overview", label: "Projektübersicht", icon: Book },
  { id: "features", label: "Feature-Status", icon: Zap },
  { id: "tech", label: "Tech Stack", icon: Code },
  { id: "structure", label: "Projektstruktur", icon: Folder },
  { id: "database", label: "Datenbank", icon: Database },
  { id: "auth", label: "Authentifizierung", icon: Shield },
  { id: "messages", label: "Nachrichten", icon: MessageSquare },
  { id: "rides", label: "Fahrten-System", icon: Car },
  { id: "push", label: "Push Notifications", icon: Bell },
  { id: "bugs", label: "Bug Reports", icon: Bug },
  { id: "admin", label: "Admin-Panel", icon: Settings },
  { id: "security", label: "Sicherheit", icon: Lock },
  { id: "env", label: "Environment", icon: Server },
  { id: "deploy", label: "Deployment", icon: Globe },
  { id: "sql", label: "SQL-Befehle", icon: Terminal },
]

// ─── Main Page ──────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("")
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500)
      const sections = document.querySelectorAll("section[id]")
      let current = ""
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        if (rect.top <= 150) {
          current = section.id
        }
      })
      setActiveSection(current)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Fahr mit! - Developer Documentation</title>
      </head>

      <div className="min-h-screen bg-background">
        {/* ── Header ── */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-6 flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/carcashflow-fahrmit-light.svg"
                alt="Carcashflow"
                width={120}
                height={28}
                className="hidden dark:block"
              />
              <Image
                src="/carcashflow-fahrmit-dark.svg"
                alt="Carcashflow"
                width={120}
                height={28}
                className="block dark:hidden"
              />
              <span className="font-semibold text-muted-foreground">Docs</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">MVP 1.0</Badge>
              <span className="text-xs text-muted-foreground">Feb 2026</span>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex gap-10">

            {/* ── Sidebar ── */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                  Inhalt
                </p>
                <nav className="space-y-0.5">
                  {tableOfContents.map((item) => {
                    const Icon = item.icon
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] transition-colors",
                          activeSection === item.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {item.label}
                      </a>
                    )
                  })}
                </nav>

                <Separator className="my-6" />

                <div className="px-3 py-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <span className="text-xs font-medium">Built with AI</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Entwickelt mit AI. Architektur, DB-Design und Frontend-Code.
                  </p>
                </div>
              </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 min-w-0 max-w-4xl">

              {/* Hero */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <h1 className="text-3xl font-bold tracking-tight mb-3">Technische Dokumentation</h1>
                <p className="text-lg text-muted-foreground mb-4">
                  Alles was du brauchst um die Fahr mit! Plattform zu verstehen, weiterzuentwickeln oder zu warten.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Next.js 15</Badge>
                  <Badge variant="outline">React 19</Badge>
                  <Badge variant="outline">TypeScript</Badge>
                  <Badge variant="outline">Supabase</Badge>
                  <Badge variant="outline">Tailwind 4</Badge>
                  <Badge variant="outline">Vercel</Badge>
                </div>
              </motion.div>

              {/* ─── 1. Projektübersicht ─── */}
              <Section id="overview">
                <SectionTitle number="1">Projektübersicht</SectionTitle>
                <Paragraph>
                  <strong className="text-foreground">Fahr mit!</strong> ist eine Mitfahrbörse für Fahrzeugüberführer und Schulungsteilnehmer.
                  Die Plattform verbindet Nutzer die Fahrten anbieten oder suchen. Es handelt sich ausschließlich um
                  <strong className="text-foreground"> Kontaktanbahnung</strong> - keine Vermittlung, keine Haftung durch den Betreiber.
                </Paragraph>

                <div className="grid gap-3 sm:grid-cols-3 my-6">
                  <InfoCard icon={Car} title="Mitfahrbörse">
                    Fahrten anbieten oder suchen mit Multi-Stopp-Routen und automatischem Matching.
                  </InfoCard>
                  <InfoCard icon={MessageSquare} title="Nachrichten">
                    1:1 Echtzeit-Chat mit Typing-Indicator, Online-Status und Push Notifications.
                  </InfoCard>
                  <InfoCard icon={Route} title="Route-Matching">
                    Automatische Benachrichtigung wenn jemand eine passende Fahrt erstellt (max. 30km Abweichung).
                  </InfoCard>
                </div>
              </Section>

              <Separator className="my-10" />

              {/* ─── 2. Feature-Status ─── */}
              <Section id="features">
                <SectionTitle number="2">Feature-Status</SectionTitle>
                <Paragraph>
                  Übersicht aller Features - was läuft, was deaktiviert ist und was geplant ist.
                </Paragraph>

                <DataTable
                  headers={["Feature", "Status", "Details"]}
                  rows={[
                    ["Registrierung & Login", <StatusBadge key="auth" status="active" />, "Email/Passwort via Supabase Auth"],
                    ["Google OAuth", <StatusBadge key="oauth" status="disabled" />, "Code vorhanden, aber auskommentiert"],
                    ["Profil-System", <StatusBadge key="profile" status="active" />, "Profil bearbeiten, Avatar, City"],
                    ["Mitfahrbörse", <StatusBadge key="rides" status="active" />, "Fahrten erstellen, filtern, suchen"],
                    ["Multi-Stopp-Routen", <StatusBadge key="routes" status="active" />, "Start → Zwischenstopps → Ziel mit Geocoding"],
                    ["Route-Matching", <StatusBadge key="match" status="active" />, "Automatischer Abgleich passender Fahrten"],
                    ["Wiederkehrende Fahrten", <StatusBadge key="recurring" status="active" />, "Wöchentlich wiederholende Fahrten"],
                    ["Nachrichten-System", <StatusBadge key="msg" status="active" />, "1:1 Chat mit Supabase Realtime"],
                    ["Typing-Indicator", <StatusBadge key="typing" status="active" />, "Zeigt an wenn jemand tippt"],
                    ["Online-Status", <StatusBadge key="online" status="active" />, "Grüner Punkt bei aktiven Usern"],
                    ["Chat entfernen", <StatusBadge key="hide" status="active" />, "Soft-Delete pro User (nicht permanent)"],
                    ["Push Notifications", <StatusBadge key="push" status="active" />, "Web Push bei neuen Nachrichten"],
                    ["In-App Notifications", <StatusBadge key="notif" status="active" />, "Glocke mit Unread-Badge"],
                    ["Route-Watches", <StatusBadge key="watches" status="active" />, "Auto-Benachrichtigung bei passenden Fahrten"],
                    ["Bug Reports", <StatusBadge key="bugs" status="active" />, "Fehlermeldung mit Screenshots"],
                    ["Admin-Panel", <StatusBadge key="admin" status="active" />, "Stats, User-Verwaltung, Bug Reports"],
                    ["E2E-Verschlüsselung", <StatusBadge key="e2e" status="disabled" />, "Entfernt - nicht zuverlässig in Web-Apps"],
                    ["Stripe/Subscription", <StatusBadge key="stripe" status="planned" />, "Vorbereitet, noch nicht implementiert"],
                  ]}
                />
              </Section>

              <Separator className="my-10" />

              {/* ─── 3. Tech Stack ─── */}
              <Section id="tech">
                <SectionTitle number="3">Tech Stack</SectionTitle>

                <SubTitle>Frontend</SubTitle>
                <DataTable
                  headers={["Technologie", "Verwendung"]}
                  rows={[
                    [<strong key="next">Next.js 15</strong>, "App Router, Server Components, Middleware"],
                    [<strong key="react">React 19</strong>, "UI mit Hooks, Client Components"],
                    [<strong key="ts">TypeScript (strict)</strong>, "Durchgehende Typisierung"],
                    [<strong key="tw">Tailwind CSS 4</strong>, "Utility-first Styling"],
                    [<strong key="shad">shadcn/ui</strong>, "UI-Komponenten auf Radix-Basis"],
                    [<strong key="motion">Motion</strong>, "Animationen: Stagger, Hover, Page Transitions"],
                    [<strong key="lucide">Lucide React</strong>, "Icon-Library"],
                    [<strong key="themes">next-themes</strong>, "Dark/Light Mode Toggle"],
                    [<strong key="nuqs">nuqs</strong>, "URL-basiertes State Management"],
                    [<strong key="sonner">sonner</strong>, "Toast Notifications"],
                  ]}
                />

                <SubTitle>Backend & Services</SubTitle>
                <DataTable
                  headers={["Service", "Verwendung"]}
                  rows={[
                    [<strong key="supa">Supabase</strong>, "PostgreSQL, Auth, Realtime, Storage"],
                    [<strong key="vercel">Vercel</strong>, "Hosting, CI/CD, Serverless Functions"],
                    [<strong key="gh">GitHub</strong>, "Repository, Auto-Deploy bei Push auf main"],
                  ]}
                />

                <SubTitle>Externe APIs</SubTitle>
                <DataTable
                  headers={["API", "Endpunkt", "Wofür"]}
                  rows={[
                    [<strong key="photon">Photon (Komoot)</strong>, <InlineCode key="photon-url">photon.komoot.io</InlineCode>, "Adresssuche / Geocoding"],
                    [<strong key="osrm">OSRM</strong>, <InlineCode key="osrm-url">router.project-osrm.org</InlineCode>, "Routen-Berechnung und Polylines"],
                  ]}
                />
              </Section>

              <Separator className="my-10" />

              {/* ─── 4. Projektstruktur ─── */}
              <Section id="structure">
                <SectionTitle number="4">Projektstruktur</SectionTitle>
                <Paragraph>
                  Die App nutzt den Next.js App Router. Geschützte Seiten liegen unter <InlineCode>(authenticated)/</InlineCode>,
                  API-Routes unter <InlineCode>api/</InlineCode>.
                </Paragraph>
                <CodeBlock language="text" title="Ordnerstruktur">{`src/
  app/
    (authenticated)/          Geschützte Seiten (Login nötig)
      dashboard/              Mitfahrbörse - Hauptseite
      messages/               Chat-Übersicht
        [id]/                 Einzelner Chat
      profile/                Eigenes Profil bearbeiten
      settings/               Einstellungen + Admin-Tab
      help/                   Hilfe & Bug melden
      changelog/              App-Updates

    admin/docs/               Diese Wiki-Seite

    api/
      rides/                  GET, POST, PATCH, DELETE
        match/                Route-Matching Algorithmus
      messages/               Nachrichten senden
      conversations/          Chat erstellen/laden
      notifications/          In-App Benachrichtigungen
      push/                   Web Push subscribe/unsubscribe
      bug-report/             Bug Reports CRUD
      settings/               Profil-Updates, Avatar-Upload
      admin/                  Stats, Users, Bug Reports (Service Role)

    auth/callback/            Supabase Auth Callback
    auth/redirect/            Post-Login Redirect
    login/
    signup/
  components/
    ui/                       shadcn/ui Basis-Komponenten
    layout/                   AppShell, Sidebar, Header, MobileNav
    rides/                    RideCard, CreateRideForm, Filters
    messages/                 ConversationList, ConversationView
    notifications/            NotificationDropdown, Badge
    settings/                 AdminTab, ProfileForm
    help/                     BugReportModal

  lib/
    supabase/client.ts        Browser-Client (Anon Key)
    supabase/server.ts        Server-Client (Session)
    supabase/admin.ts         Service Role Client (NUR API!)
    push/server.ts            Web Push senden
    animations.ts             Motion Variants
    utils.ts                  cn(), formatDate(), etc.

  middleware.ts               Auth-Check für geschützte Routen`}</CodeBlock>
              </Section>

              <Separator className="my-10" />

              {/* ─── 5. Datenbank ─── */}
              <Section id="database">
                <SectionTitle number="5">Datenbank-Schema</SectionTitle>
                <Paragraph>
                  Alle Tabellen nutzen Row Level Security (RLS). User können nur ihre eigenen Daten sehen.
                  Admin-Queries laufen über den Service Role Client.
                </Paragraph>

                <SubTitle>Tabellen-Übersicht</SubTitle>
                <DataTable
                  headers={["Tabelle", "Zweck", "RLS"]}
                  rows={[
                    [<InlineCode key="t1">profiles</InlineCode>, "Nutzerprofile (erweitert auth.users)", "✅"],
                    [<InlineCode key="t2">rides</InlineCode>, "Mitfahrangebote und -gesuche", "✅"],
                    [<InlineCode key="t3">conversations</InlineCode>, "Chat-Verbindungen (2 Teilnehmer)", "✅"],
                    [<InlineCode key="t4">messages</InlineCode>, "Chat-Nachrichten", "✅"],
                    [<InlineCode key="t5">hidden_conversations</InlineCode>, "Entfernte Chats (Soft-Delete)", "✅"],
                    [<InlineCode key="t6">notifications</InlineCode>, "In-App Benachrichtigungen", "✅"],
                    [<InlineCode key="t7">push_subscriptions</InlineCode>, "Web Push Endpoints", "✅"],
                    [<InlineCode key="t8">bug_reports</InlineCode>, "Fehlermeldungen von Usern", "✅"],
                    [<InlineCode key="t9">route_watches</InlineCode>, "Gespeicherte Routen-Alerts", "✅"],
                    [<InlineCode key="t10">super_admins</InlineCode>, "Admin-Berechtigungen", "✅"],
                  ]}
                />

                <SubTitle>profiles</SubTitle>
                <Paragraph>
                  Wird automatisch bei Registrierung erstellt (via Trigger). Username = Email-Prefix + erste 4 Zeichen der User-ID.
                </Paragraph>
                <CodeBlock language="sql" title="profiles">{`CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  training_location TEXT,
  training_date DATE,
  theme_preference TEXT DEFAULT 'system',
  notification_preferences JSONB,
  push_enabled BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);`}</CodeBlock>

                <SubTitle>rides</SubTitle>
                <Paragraph>
                  Mitfahrangebote und -gesuche. Route wird als JSON-Array von RoutePoints gespeichert.
                </Paragraph>
                <CodeBlock language="sql" title="rides">{`CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,            -- 'offer' oder 'request'
  route JSONB NOT NULL,          -- Array von RoutePoints
  departure_date DATE NOT NULL,
  departure_time TIME,
  seats_available INTEGER DEFAULT 1,
  comment TEXT,
  status TEXT DEFAULT 'active',  -- 'active', 'completed', 'cancelled', 'expired'
  is_recurring BOOLEAN DEFAULT false,
  recurring_days INTEGER[],      -- z.B. [1,3,5] = Mo,Mi,Fr
  recurring_until DATE,
  route_geometry JSONB,          -- OSRM Polyline
  route_distance INTEGER,        -- Meter
  route_duration INTEGER,        -- Sekunden
  expires_at TIMESTAMPTZ         -- Auto-Expire nach 7 Tagen
);`}</CodeBlock>

                <CodeBlock language="typescript" title="RoutePoint Interface">{`interface RoutePoint {
  type: "start" | "stop" | "end"
  address: string
  lat?: number
  lng?: number
  order: number
}`}</CodeBlock>

                <SubTitle>conversations + messages</SubTitle>
                <CodeBlock language="sql" title="conversations & messages">{`-- Jede Conversation hat genau 2 Teilnehmer
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES profiles(id),
  participant_2 UUID NOT NULL REFERENCES profiles(id),
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  UNIQUE(participant_1, participant_2)  -- Normalisiert: kleinere UUID zuerst
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);`}</CodeBlock>

                <SubTitle>hidden_conversations (Chat entfernen)</SubTitle>
                <Paragraph>So funktioniert &quot;Chat entfernen&quot;:</Paragraph>
                <div className="space-y-2 my-4">
                  <FlowStep number={1}>User A klickt &quot;Entfernen&quot; — Eintrag in <InlineCode>hidden_conversations</InlineCode> wird erstellt</FlowStep>
                  <FlowStep number={2}>Chat verschwindet nur für User A. User B sieht ihn weiterhin.</FlowStep>
                  <FlowStep number={3}>Wenn User B eine neue Nachricht schickt, wird der hidden-Eintrag gelöscht und der Chat taucht wieder auf.</FlowStep>
                  <FlowStep number={4}>Wenn <strong className="text-foreground">beide</strong> User den Chat entfernen, wird die Conversation samt Nachrichten permanent gelöscht.</FlowStep>
                </div>

                <SubTitle>bug_reports</SubTitle>
                <CodeBlock language="sql" title="bug_reports">{`CREATE TABLE bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  area TEXT NOT NULL,           -- 'dashboard', 'messages', 'profile', etc.
  description TEXT NOT NULL,
  worked_before TEXT,
  expected_behavior TEXT,
  screenshots TEXT[],           -- Array von Storage-URLs
  status TEXT DEFAULT 'open',   -- 'open' → 'in_progress' → 'resolved' / 'wont_fix'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
);`}</CodeBlock>

                <SubTitle>route_watches</SubTitle>
                <Paragraph>
                  User können Routen oder Orte speichern und werden automatisch benachrichtigt, wenn neue passende Fahrten erstellt werden.
                </Paragraph>
                <CodeBlock language="sql" title="route_watches">{`CREATE TABLE route_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,            -- 'location' oder 'route'
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  radius INTEGER,                -- km
  address TEXT,
  start_lat DECIMAL(10, 8), start_lng DECIMAL(11, 8), start_address TEXT,
  end_lat DECIMAL(10, 8), end_lng DECIMAL(11, 8), end_address TEXT,
  ride_type TEXT DEFAULT 'both', -- 'offer', 'request', 'both'
  created_at TIMESTAMPTZ DEFAULT now(),
  last_notified_at TIMESTAMPTZ
);`}</CodeBlock>
              </Section>

              <Separator className="my-10" />

              {/* ─── 6. Auth ─── */}
              <Section id="auth">
                <SectionTitle number="6">Authentifizierung</SectionTitle>
                <div className="flex items-center gap-2 mb-4"><StatusBadge status="active" /><span className="text-sm text-muted-foreground">Email/Passwort via Supabase Auth</span></div>

                <SubTitle>Registrierung</SubTitle>
                <div className="space-y-2 my-4">
                  <FlowStep number={1}>User füllt Formular aus (Email, Passwort, Vorname)</FlowStep>
                  <FlowStep number={2}>Supabase erstellt Auth-User</FlowStep>
                  <FlowStep number={3}>DB-Trigger erstellt automatisch ein Profil mit generiertem Username</FlowStep>
                  <FlowStep number={4}>User bekommt Bestätigungs-Email</FlowStep>
                  <FlowStep number={5}>Nach Klick auf Link: Redirect zu <InlineCode>/dashboard</InlineCode></FlowStep>
                </div>

                <SubTitle>Login</SubTitle>
                <div className="space-y-2 my-4">
                  <FlowStep number={1}>Email + Passwort eingeben</FlowStep>
                  <FlowStep number={2}>Supabase validiert Credentials, setzt Session Cookie</FlowStep>
                  <FlowStep number={3}>Redirect zu <InlineCode>/dashboard</InlineCode></FlowStep>
                </div>

                <SubTitle>Middleware</SubTitle>
                <Paragraph>
                  Die Datei <InlineCode>middleware.ts</InlineCode> prüft bei jedem Request ob der User eingeloggt ist.
                  Geschützte Routen: <InlineCode>/dashboard</InlineCode>, <InlineCode>/messages</InlineCode>, <InlineCode>/profile</InlineCode>, <InlineCode>/settings</InlineCode>.
                </Paragraph>

                <SubTitle>Google OAuth</SubTitle>
                <div className="flex items-center gap-2 mb-3"><StatusBadge status="disabled" /><span className="text-sm text-muted-foreground">Code vorhanden, aber auskommentiert</span></div>
                <Paragraph>So aktivierst du Google OAuth:</Paragraph>
                <div className="space-y-2 my-4">
                  <FlowStep number={1}>Google Cloud Console: OAuth 2.0 Client ID erstellen</FlowStep>
                  <FlowStep number={2}>Supabase Dashboard → Authentication → Providers → Google aktivieren</FlowStep>
                  <FlowStep number={3}>Redirect URI eintragen: <InlineCode>{'https://[PROJECT_REF].supabase.co/auth/v1/callback'}</InlineCode></FlowStep>
                  <FlowStep number={4}>In <InlineCode>login-form.tsx</InlineCode> und <InlineCode>signup-form.tsx</InlineCode> die Google-Buttons einkommentieren</FlowStep>
                </div>
              </Section>

              <Separator className="my-10" />

              {/* ─── 7. Nachrichten ─── */}
              <Section id="messages">
                <SectionTitle number="7">Nachrichtensystem</SectionTitle>
                <div className="flex items-center gap-2 mb-4"><StatusBadge status="active" /><span className="text-sm text-muted-foreground">1:1 Chat mit Supabase Realtime</span></div>

                <SubTitle>So funktioniert es</SubTitle>
                <div className="space-y-2 my-4">
                  <FlowStep number={1}>User klickt auf einer Fahrt auf &quot;Nachricht senden&quot;</FlowStep>
                  <FlowStep number={2}>System erstellt oder öffnet eine Conversation (immer nur 1 pro User-Paar)</FlowStep>
                  <FlowStep number={3}>Nachrichten werden in Echtzeit über Supabase Realtime synchronisiert</FlowStep>
                  <FlowStep number={4}>Der andere User bekommt Push Notification + In-App Notification</FlowStep>
                </div>

                <SubTitle>Realtime-Kanäle</SubTitle>
                <Paragraph>Es gibt 3 Echtzeit-Funktionen:</Paragraph>

                <div className="grid gap-3 sm:grid-cols-3 my-4">
                  <InfoCard icon={MessageSquare} title="Neue Nachrichten">
                    Über <InlineCode>postgres_changes</InlineCode> auf der messages-Tabelle. Wird bei jedem INSERT getriggert.
                  </InfoCard>
                  <InfoCard icon={Eye} title="Typing-Indicator">
                    Über Supabase Broadcast Channel. Sendet &quot;ich tippe gerade&quot; Events.
                  </InfoCard>
                  <InfoCard icon={Users} title="Online-Status">
                    Über Supabase Presence. Andere User sehen ob du gerade online bist (grüner Punkt).
                  </InfoCard>
                </div>

                <CodeBlock language="typescript" title="Realtime: Neue Nachrichten empfangen">{`supabase
  .channel(\`conversation:\${conversationId}\`)
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "messages",
    filter: \`conversation_id=eq.\${conversationId}\`,
  }, handleNewMessage)
  .subscribe()`}</CodeBlock>

                <SubTitle>E2E-Verschlüsselung</SubTitle>
                <div className="flex items-center gap-2 mb-3"><StatusBadge status="disabled" /><span className="text-sm text-muted-foreground">Entfernt seit Februar 2025</span></div>
                <Paragraph>
                  Web-Apps können Krypto-Schlüssel nicht zuverlässig speichern (IndexedDB kann jederzeit vom Browser gelöscht werden).
                  Aktuelle Sicherheit: TLS/HTTPS, Supabase Encryption at rest, Row Level Security.
                  Gleiches Niveau wie Slack, Discord oder Teams.
                </Paragraph>
              </Section>

              <Separator className="my-10" />

              {/* ─── 8. Fahrten ─── */}
              <Section id="rides">
                <SectionTitle number="8">Fahrten-System</SectionTitle>
                <div className="flex items-center gap-2 mb-4"><StatusBadge status="active" /><span className="text-sm text-muted-foreground">Erstellen, Suchen, Filtern, Matching</span></div>

                <div className="grid gap-3 sm:grid-cols-2 my-4">
                  <div className="rounded-xl border p-4 bg-emerald-500/5 border-emerald-500/20">
                    <span className="text-sm font-semibold text-emerald-500">offer</span>
                    <p className="text-sm text-muted-foreground mt-1">User bietet eine Mitfahrgelegenheit an</p>
                  </div>
                  <div className="rounded-xl border p-4 bg-blue-500/5 border-blue-500/20">
                    <span className="text-sm font-semibold text-blue-500">request</span>
                    <p className="text-sm text-muted-foreground mt-1">User sucht eine Mitfahrgelegenheit</p>
                  </div>
                </div>

                <SubTitle>API-Endpoints</SubTitle>
                <DataTable
                  headers={["Methode", "Endpoint", "Beschreibung"]}
                  rows={[
                    [<Badge key="get1" variant="outline">GET</Badge>, <InlineCode key="e1">/api/rides</InlineCode>, "Alle aktiven Fahrten laden"],
                    [<Badge key="post1" variant="outline">POST</Badge>, <InlineCode key="e2">/api/rides</InlineCode>, "Neue Fahrt erstellen"],
                    [<Badge key="get2" variant="outline">GET</Badge>, <InlineCode key="e3">/api/rides/[id]</InlineCode>, "Einzelne Fahrt laden"],
                    [<Badge key="patch1" variant="outline">PATCH</Badge>, <InlineCode key="e4">/api/rides/[id]</InlineCode>, "Fahrt aktualisieren"],
                    [<Badge key="del1" variant="outline">DELETE</Badge>, <InlineCode key="e5">/api/rides/[id]</InlineCode>, "Fahrt löschen"],
                    [<Badge key="post2" variant="outline">POST</Badge>, <InlineCode key="e6">/api/rides/match</InlineCode>, "Passende Fahrten finden"],
                  ]}
                />

                <SubTitle>Route-Matching Algorithmus</SubTitle>
                <div className="space-y-2 my-4">
                  <FlowStep number={1}>Berechne Entfernung vom eigenen Start zu allen anderen Starts</FlowStep>
                  <FlowStep number={2}>Berechne Entfernung vom eigenen Ziel zu allen anderen Zielen</FlowStep>
                  <FlowStep number={3}>Filtere: Max 30km Abweichung</FlowStep>
                  <FlowStep number={4}>Sortiere nach geringster Gesamtabweichung</FlowStep>
                  <FlowStep number={5}>Benachrichtige User mit passenden Route-Watches</FlowStep>
                </div>

                <SubTitle>Wiederkehrende Fahrten</SubTitle>
                <CodeBlock language="typescript" title="Wiederkehrende Fahrt">{`{
  is_recurring: true,
  recurring_days: [1, 3, 5],    // 0=So, 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa
  recurring_until: "2026-06-30"
}`}</CodeBlock>
                <Paragraph>Das System erstellt automatisch einzelne Ride-Einträge für jeden Tag. Einmalige Fahrten laufen nach 7 Tagen ab.</Paragraph>
              </Section>

              <Separator className="my-10" />

              {/* ─── 9. Push ─── */}
              <Section id="push">
                <SectionTitle number="9">Push Notifications</SectionTitle>
                <div className="flex items-center gap-2 mb-4"><StatusBadge status="active" /><span className="text-sm text-muted-foreground">Web Push bei neuen Nachrichten</span></div>

                <SubTitle>So funktioniert es</SubTitle>
                <div className="space-y-2 my-4">
                  <FlowStep number={1}>User aktiviert Push in den Einstellungen</FlowStep>
                  <FlowStep number={2}>Browser fragt um Erlaubnis</FlowStep>
                  <FlowStep number={3}>Service Worker (<InlineCode>public/sw.js</InlineCode>) registriert Push-Subscription</FlowStep>
                  <FlowStep number={4}>Subscription wird in <InlineCode>push_subscriptions</InlineCode> gespeichert</FlowStep>
                  <FlowStep number={5}>Bei neuer Nachricht: Server sendet Push über Web Push Protocol</FlowStep>
                </div>

                <SubTitle>VAPID Keys einrichten</SubTitle>
                <CodeBlock language="bash" title="Keys generieren">{`npx web-push generate-vapid-keys`}</CodeBlock>
                <CodeBlock language="env" title=".env">{`NEXT_PUBLIC_VAPID_PUBLIC_KEY=dein_public_key
VAPID_PRIVATE_KEY=dein_private_key`}</CodeBlock>

                <SubTitle>Endpoints</SubTitle>
                <DataTable
                  headers={["Methode", "Endpoint", "Beschreibung"]}
                  rows={[
                    [<Badge key="p1" variant="outline">POST</Badge>, <InlineCode key="pe1">/api/push/subscribe</InlineCode>, "Subscription registrieren"],
                    [<Badge key="p2" variant="outline">DELETE</Badge>, <InlineCode key="pe2">/api/push/subscribe</InlineCode>, "Subscription entfernen"],
                    [<Badge key="p3" variant="outline">POST</Badge>, <InlineCode key="pe3">/api/push/test</InlineCode>, "Test-Push senden (Debug)"],
                  ]}
                />
              </Section>

              <Separator className="my-10" />

              {/* ─── 10. Bug Reports ─── */}
              <Section id="bugs">
                <SectionTitle number="10">Bug Reports</SectionTitle>
                <div className="flex items-center gap-2 mb-4"><StatusBadge status="active" /></div>

                <div className="grid gap-4 sm:grid-cols-2 my-4">
                  <InfoCard icon={Users} title="User-Flow">
                    <div className="space-y-1.5 mt-2">
                      <p>1. Öffnet <InlineCode>/help</InlineCode> → &quot;Fehler melden&quot;</p>
                      <p>2. Füllt Formular aus (Titel, Bereich, Beschreibung)</p>
                      <p>3. Optional: Screenshots hochladen</p>
                      <p>4. Bug wird in DB gespeichert</p>
                    </div>
                  </InfoCard>
                  <InfoCard icon={Settings} title="Admin-Flow">
                    <div className="space-y-1.5 mt-2">
                      <p>1. Einstellungen → Admin-Tab → Bugs</p>
                      <p>2. Alle gemeldeten Bugs mit Status-Badge</p>
                      <p>3. Status ändern: open → in_progress → resolved</p>
                      <p>4. Läuft über <InlineCode>/api/admin/bug-reports</InlineCode></p>
                    </div>
                  </InfoCard>
                </div>
              </Section>

              <Separator className="my-10" />

              {/* ─── 11. Admin ─── */}
              <Section id="admin">
                <SectionTitle number="11">Admin-Panel</SectionTitle>
                <div className="flex items-center gap-2 mb-4"><StatusBadge status="active" /><span className="text-sm text-muted-foreground">Integriert in Einstellungen</span></div>

                <Paragraph>
                  Nur User in der Tabelle <InlineCode>super_admins</InlineCode> sehen den Admin-Tab in den Einstellungen.
                  Es gibt kein separates <InlineCode>/admin</InlineCode> Dashboard.
                </Paragraph>

                <DataTable
                  headers={["Tab", "Funktionen"]}
                  rows={[
                    [<strong key="a1">Übersicht</strong>, "Stats (User, Fahrten, Nachrichten, Reports, Bugs), letzte User"],
                    [<strong key="a2">Nutzer</strong>, "User-Liste mit Suche, Details anzeigen"],
                    [<strong key="a3">Reports</strong>, "Gemeldete User/Inhalte bearbeiten (lösen/abweisen)"],
                    [<strong key="a4">Bugs</strong>, "Bug Reports bearbeiten (offen → in Bearbeitung → gelöst)"],
                  ]}
                />

                <SubTitle>Admin hinzufügen</SubTitle>
                <CodeBlock language="sql" title="Admin eintragen">{`-- 1. User-ID herausfinden
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- 2. Als Admin eintragen
INSERT INTO super_admins (user_id, role)
VALUES ('die-user-uuid', 'super_admin');`}</CodeBlock>

                <Callout type="warning">
                  <strong>Wichtig:</strong> Admin-Queries verwenden den Service Role Key um RLS zu umgehen.
                  Der Service Role Client darf <strong>niemals</strong> im Browser-Code verwendet werden — nur in API-Routes!
                </Callout>
              </Section>

              <Separator className="my-10" />

              {/* ─── 12. Sicherheit ─── */}
              <Section id="security">
                <SectionTitle number="12">Sicherheit</SectionTitle>

                <SubTitle>Row Level Security (RLS)</SubTitle>
                <Paragraph>
                  Alle Tabellen haben RLS aktiviert. Jeder User kann nur seine eigenen Daten sehen und ändern.
                </Paragraph>
                <CodeBlock language="sql" title="Beispiel: RLS für messages">{`-- User sehen nur Nachrichten aus eigenen Chats
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
  )
);`}</CodeBlock>

                <SubTitle>Supabase Clients</SubTitle>
                <DataTable
                  headers={["Client", "Datei", "Verwendung", "RLS"]}
                  rows={[
                    ["Browser", <InlineCode key="c1">lib/supabase/client.ts</InlineCode>, "Client Components", "✅ Ja"],
                    ["Server", <InlineCode key="c2">lib/supabase/server.ts</InlineCode>, "Server Components, API Routes", "✅ Ja"],
                    ["Admin", <InlineCode key="c3">lib/supabase/admin.ts</InlineCode>, "API Routes für Admin-Ops", <strong key="c3s" className="text-orange-500">Nein (Service Role)</strong>],
                  ]}
                />
              </Section>

              <Separator className="my-10" />

              {/* ─── 13. Env ─── */}
              <Section id="env">
                <SectionTitle number="13">Environment Variables</SectionTitle>

                <SubTitle>Pflicht</SubTitle>
                <CodeBlock language="env" title=".env (Pflicht)">{`# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN...
VAPID_PRIVATE_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=https://app.carcashflow.de`}</CodeBlock>

                <SubTitle>Optional (noch nicht aktiv)</SubTitle>
                <CodeBlock language="env" title=".env (Optional)">{`# Stripe (für spätere Subscription)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...`}</CodeBlock>

                <Callout type="info">
                  <strong>Vercel Setup:</strong> Alle Variablen im Vercel Dashboard unter Project → Settings → Environment Variables für Production und Preview eintragen.
                  <InlineCode>SUPABASE_SERVICE_ROLE_KEY</InlineCode> ist nur serverseitig (kein <InlineCode>NEXT_PUBLIC_</InlineCode> Prefix).
                </Callout>
              </Section>

              <Separator className="my-10" />

              {/* ─── 14. Deployment ─── */}
              <Section id="deploy">
                <SectionTitle number="14">Deployment</SectionTitle>
                <Paragraph>
                  Jeder Push auf <InlineCode>main</InlineCode> deployed automatisch zu Vercel via GitHub Integration.
                </Paragraph>

                <CodeBlock language="bash" title="Deployment-Befehle">{`# Lokaler Dev-Server
npm run dev

# Production Build
npm run build

# Manuelles Deployment
vercel --prod`}</CodeBlock>
              </Section>

              <Separator className="my-10" />

              {/* ─── 15. SQL ─── */}
              <Section id="sql">
                <SectionTitle number="15">Häufige SQL-Befehle</SectionTitle>
                <Paragraph>
                  Diese Befehle direkt im Supabase SQL-Editor ausführen.
                </Paragraph>

                <SubTitle>User sperren / entsperren</SubTitle>
                <CodeBlock language="sql" title="User sperren">{`UPDATE profiles SET is_banned = true WHERE id = 'user-uuid';`}</CodeBlock>
                <CodeBlock language="sql" title="User entsperren">{`UPDATE profiles SET is_banned = false WHERE id = 'user-uuid';`}</CodeBlock>

                <SubTitle>Fahrten löschen</SubTitle>
                <CodeBlock language="sql" title="Alle Fahrten eines Users">{`DELETE FROM rides WHERE user_id = 'user-uuid';`}</CodeBlock>

                <SubTitle>Statistiken</SubTitle>
                <CodeBlock language="sql" title="Aktive User (letzte 7 Tage)">{`SELECT COUNT(*) FROM profiles
WHERE last_seen_at > NOW() - INTERVAL '7 days';`}</CodeBlock>

                <CodeBlock language="sql" title="Fahrten nach Typ">{`SELECT type, COUNT(*) FROM rides
WHERE status = 'active'
GROUP BY type;`}</CodeBlock>

                <CodeBlock language="sql" title="Nachrichten pro Tag (30 Tage)">{`SELECT DATE(created_at) as tag, COUNT(*) as anzahl
FROM messages
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY tag DESC;`}</CodeBlock>
              </Section>

              {/* ── End ── */}
              <Separator className="my-10" />
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Carcashflow. Alle Rechte vorbehalten.
                </p>
              </div>

            </main>
          </div>
        </div>

        {/* Scroll to top */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: showScrollTop ? 1 : 0,
            scale: showScrollTop ? 1 : 0.8,
            pointerEvents: showScrollTop ? "auto" : "none"
          }}
          className="fixed bottom-6 right-6"
        >
          <Button size="icon" variant="secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-full shadow-lg">
            <ChevronUp className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </>
  )
}
