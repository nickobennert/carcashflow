"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import {
  LayoutDashboard,
  MessageSquare,
  User,
  Users,
  Settings,
  HelpCircle,
  FileText,
  CreditCard,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonPress } from "@/lib/animations"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

const mainNavItems: NavItem[] = [
  {
    title: "Rückfahrten",
    href: "/dashboard",
    icon: LayoutDashboard,
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
]

const secondaryNavItems: NavItem[] = [
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
  },
  {
    title: "Hilfe",
    href: "/help",
    icon: HelpCircle,
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
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1.5">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={pathname === item.href} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1.5">
          {secondaryNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={pathname === item.href} />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Carcashflow
        </p>
      </div>
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
        {...buttonPress}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{item.title}</span>
        {item.badge && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {item.badge}
          </span>
        )}
      </motion.div>
    </Link>
  )
}
