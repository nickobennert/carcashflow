"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { motion } from "motion/react"
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
  ExternalLink,
  ChevronUp,
  Copy,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Wiki content - imported at build time would be better, but for simplicity we use fetch
const WIKI_PATH = "/api/docs/wiki"

export default function DocsPage() {
  const [content, setContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState("")
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    // Fetch wiki content from API
    fetch(WIKI_PATH)
      .then((res) => res.text())
      .then((text) => {
        setContent(text)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Error loading wiki:", err)
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500)

      // Update active section based on scroll position
      const headings = document.querySelectorAll("h2[id]")
      let current = ""
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect()
        if (rect.top <= 150) {
          current = heading.id
        }
      })
      setActiveSection(current)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const tableOfContents = [
    { id: "1-projektübersicht", label: "Projektübersicht", icon: Book },
    { id: "2-tech-stack", label: "Tech Stack", icon: Code },
    { id: "3-projektstruktur", label: "Projektstruktur", icon: Database },
    { id: "4-datenbank-schema", label: "Datenbank-Schema", icon: Database },
    { id: "5-authentifizierung", label: "Authentifizierung", icon: Shield },
    { id: "6-nachrichtensystem", label: "Nachrichtensystem", icon: MessageSquare },
    { id: "7-fahrten-system-rides", label: "Fahrten-System", icon: Car },
    { id: "8-push-notifications", label: "Push Notifications", icon: Bell },
    { id: "9-bug-reports", label: "Bug Reports", icon: MessageSquare },
    { id: "10-admin-panel", label: "Admin-Panel", icon: Shield },
    { id: "11-sicherheit", label: "Sicherheit", icon: Shield },
    { id: "12-environment-variables", label: "Environment Variables", icon: Server },
    { id: "13-deployment", label: "Deployment", icon: Server },
    { id: "14-bekannte-einschränkungen", label: "Einschränkungen", icon: Book },
    { id: "15-sql-referenz", label: "SQL-Referenz", icon: Database },
  ]

  return (
    <>
      {/* Meta tags for noindex */}
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Fahr mit! - Developer Documentation</title>
      </head>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Book className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-semibold">Fahr mit! Docs</h1>
                <p className="text-xs text-muted-foreground">Developer Documentation</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">v1.0 MVP</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </header>

        <div className="container py-8">
          <div className="flex gap-8">
            {/* Sidebar Navigation */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <nav className="space-y-1">
                  {tableOfContents.map((item) => {
                    const Icon = item.icon
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                          activeSection === item.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </a>
                    )
                  })}
                </nav>

                {/* Built with AI Section */}
                <div className="mt-8 p-4 rounded-lg border bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                    <span className="font-medium text-sm">Built with AI</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Diese Anwendung wurde mit Unterstützung von <strong>Claude (Anthropic)</strong> entwickelt.
                    Von der Architektur über das Datenbank-Design bis zum Frontend-Code - AI-gestützte Entwicklung für bessere Software.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <img
                      src="https://www.anthropic.com/images/icons/apple-touch-icon.png"
                      alt="Anthropic"
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-xs text-muted-foreground">Powered by Claude</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Fahr mit! - Technische Dokumentation</h1>
                    <p className="text-muted-foreground">
                      Vollständige technische Dokumentation für Entwickler der Mitfahrbörse.
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 rounded bg-muted">Next.js 15</span>
                    <span className="px-2 py-1 rounded bg-muted">React 19</span>
                    <span className="px-2 py-1 rounded bg-muted">Supabase</span>
                  </div>
                </div>
              </motion.div>

              {/* Mobile: Built with AI Banner */}
              <div className="lg:hidden mb-6 p-4 rounded-lg border bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                  <span className="font-medium text-sm">Built with AI</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Diese Anwendung wurde mit Unterstützung von Claude (Anthropic) entwickelt.
                </p>
              </div>

              {/* Markdown Content */}
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-full mb-2"></div>
                      <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-4/6"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <motion.article
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="prose prose-zinc dark:prose-invert max-w-none
                    prose-headings:scroll-mt-20
                    prose-h2:text-2xl prose-h2:font-bold prose-h2:border-b prose-h2:pb-2 prose-h2:mb-4
                    prose-h3:text-xl prose-h3:font-semibold
                    prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-zinc-900 prose-pre:border prose-pre:rounded-lg
                    prose-table:text-sm
                    prose-th:bg-muted prose-th:p-2
                    prose-td:p-2 prose-td:border-t
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:rounded-r
                  "
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({ node, children, ...props }) => {
                        const text = String(children)
                        const id = text
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^\w-]/g, "")
                        return (
                          <h2 id={id} {...props}>
                            {children}
                          </h2>
                        )
                      },
                      code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || "")
                        const isInline = !match

                        if (isInline) {
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          )
                        }

                        return (
                          <CodeBlock language={match[1]}>
                            {String(children).replace(/\n$/, "")}
                          </CodeBlock>
                        )
                      },
                      pre: ({ children }) => <>{children}</>,
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </motion.article>
              )}
            </main>
          </div>
        </div>

        {/* Scroll to top button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: showScrollTop ? 1 : 0,
            scale: showScrollTop ? 1 : 0.8,
            pointerEvents: showScrollTop ? "auto" : "none"
          }}
          className="fixed bottom-6 right-6"
        >
          <Button
            size="icon"
            variant="secondary"
            onClick={scrollToTop}
            className="rounded-full shadow-lg"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Footer */}
        <footer className="border-t bg-muted/30 mt-16">
          <div className="container py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Fahr mit! - Technische Dokumentation
              </p>
              <p className="text-xs text-muted-foreground">
                Letzte Aktualisierung: Februar 2025
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

// Code block component with copy functionality
function CodeBlock({ children, language }: { children: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div className="absolute left-3 top-2 text-xs text-zinc-500">
        {language}
      </div>
      <pre className="!mt-0 pt-8">
        <code className={`language-${language}`}>{children}</code>
      </pre>
    </div>
  )
}
