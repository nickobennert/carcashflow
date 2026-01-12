"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Car,
  MessageSquare,
  User,
  Users,
  Settings,
  HelpCircle,
  FileText,
  CreditCard,
  ChevronDown,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  isNew?: boolean
}

interface NavSection {
  title?: string
  items: NavItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}

const navSections: NavSection[] = [
  {
    items: [
      {
        title: "Mitfahrbörse",
        href: "/dashboard",
        icon: Car,
      },
      {
        title: "Nachrichten",
        href: "/messages",
        icon: MessageSquare,
      },
      {
        title: "Verbindungen",
        href: "/connections",
        icon: Users,
      },
      {
        title: "Mein Profil",
        href: "/profile",
        icon: User,
      },
    ],
  },
  {
    title: "Mehr",
    collapsible: true,
    defaultOpen: false,
    items: [
      {
        title: "Einstellungen",
        href: "/settings",
        icon: Settings,
      },
      {
        title: "Abonnement",
        href: "/pricing",
        icon: CreditCard,
      },
      {
        title: "Changelog",
        href: "/changelog",
        icon: FileText,
        isNew: true,
      },
      {
        title: "Hilfe",
        href: "/help",
        icon: HelpCircle,
      },
    ],
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-6 px-3">
          {navSections.map((section, index) => (
            <NavSection
              key={index}
              section={section}
              pathname={pathname}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Beta Badge */}
      <div className="px-3 pb-2">
        <div className="rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Beta</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Feedback? Schreib uns!
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Carcashflow
        </p>
      </div>
    </div>
  )
}

interface NavSectionProps {
  section: NavSection
  pathname: string
}

function NavSection({ section, pathname }: NavSectionProps) {
  const [isOpen, setIsOpen] = useState(section.defaultOpen ?? true)

  // Check if any item in section is active
  const hasActiveItem = section.items.some(
    item => pathname === item.href || pathname.startsWith(item.href + "/")
  )

  // Auto-open if has active item
  const shouldBeOpen = isOpen || hasActiveItem

  if (!section.collapsible) {
    return (
      <div className="space-y-1">
        {section.items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!shouldBeOpen)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{section.title}</span>
        <motion.div
          animate={{ rotate: shouldBeOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {shouldBeOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pt-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface NavLinkProps {
  item: NavItem
  isActive: boolean
}

function NavLink({ item, isActive }: NavLinkProps) {
  const Icon = item.icon

  return (
    <Link href={item.href}>
      <motion.div
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
          isActive
            ? "bg-primary-foreground/20"
            : "bg-muted group-hover:bg-background"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="flex-1">{item.title}</span>
        {item.badge && (
          <Badge
            variant={isActive ? "secondary" : "default"}
            className="h-5 px-1.5 text-xs"
          >
            {item.badge}
          </Badge>
        )}
        {item.isNew && (
          <Badge
            variant="outline"
            className={cn(
              "h-5 px-1.5 text-[10px] uppercase tracking-wide",
              isActive
                ? "border-primary-foreground/30 text-primary-foreground"
                : "border-amber-500/50 text-amber-600 dark:text-amber-400"
            )}
          >
            Neu
          </Badge>
        )}
      </motion.div>
    </Link>
  )
}
