"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Car,
  MessageSquare,
  Settings,
  HelpCircle,
  FileText,
  CreditCard,
  PanelLeftClose,
  PanelLeft,
  Copyright,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const mainNavItems: NavItem[] = [
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
]

const footerNavItems: NavItem[] = [
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
  isMobile?: boolean
  onNavigate?: () => void
}

export function Sidebar({ className, isMobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Force expanded on mobile
  const effectiveCollapsed = isMobile ? false : isCollapsed

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "flex h-full flex-col transition-all duration-300",
        effectiveCollapsed ? "w-16" : "w-56",
        isMobile && "w-full pt-12",
        className
      )}>
        {/* Main Navigation */}
        <ScrollArea className="flex-1 py-4">
          <div className={cn(
            "flex flex-col gap-1.5",
            effectiveCollapsed ? "px-2" : "px-3"
          )}>
            {mainNavItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                isCollapsed={effectiveCollapsed}
                onClick={onNavigate}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Footer Links */}
        <div className={cn(
          "border-t py-3",
          effectiveCollapsed ? "px-2" : "px-3"
        )}>
          <div className={cn(
            "flex flex-col gap-0.5",
            effectiveCollapsed && "gap-1.5"
          )}>
            {footerNavItems.map((item) => (
              <FooterLink
                key={item.href}
                item={item}
                isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                isCollapsed={effectiveCollapsed}
                onClick={onNavigate}
              />
            ))}
          </div>
        </div>

        {/* Collapse Button & Copyright */}
        <div className="border-t px-3 py-3">
          {/* Collapse Toggle - hide on mobile */}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "w-full flex items-center justify-center gap-2 mb-3 py-2 px-3 rounded-lg",
                "text-xs text-muted-foreground",
                "border border-dashed border-muted-foreground/30",
                "hover:border-muted-foreground/50 hover:text-foreground",
                "transition-colors",
                effectiveCollapsed && "px-2"
              )}
            >
              {effectiveCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  <span>Einklappen</span>
                </>
              )}
            </button>
          )}

          {/* Copyright */}
          {effectiveCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center cursor-default">
                  <Copyright className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                <p className="font-medium">© 2026 Fahr mit!</p>
                <p className="text-xs text-muted-foreground">BETA 1.0</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">© 2026 Fahr mit!</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">BETA 1.0</p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

interface NavLinkProps {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
}

function NavLink({ item, isActive, isCollapsed, onClick }: NavLinkProps) {
  const Icon = item.icon

  const linkContent = (
    <Link href={item.href} onClick={onClick}>
      <div
        className={cn(
          "group flex items-center rounded-lg text-sm font-medium transition-colors",
          isCollapsed ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-primary/90 hover:text-primary-foreground"
        )}
      >
        {/* Icon wrapper - nur im expanded state sichtbar */}
        {!isCollapsed && (
          <div className={cn(
            "flex items-center justify-center rounded-md transition-all duration-200",
            "h-7 w-7",
            isActive
              ? "bg-primary-foreground/15"
              : "bg-muted group-hover:bg-primary-foreground/15"
          )}>
            <Icon className="h-4 w-4 transition-colors" />
          </div>
        )}
        {/* Icon ohne Wrapper im collapsed state */}
        {isCollapsed && (
          <Icon className="h-5 w-5 transition-colors" />
        )}
        {!isCollapsed && <span className="flex-1">{item.title}</span>}
      </div>
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {item.title}
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}

interface FooterLinkProps {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
}

function FooterLink({ item, isActive, isCollapsed, onClick }: FooterLinkProps) {
  const Icon = item.icon

  const linkContent = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 py-1.5 text-sm transition-colors rounded-md",
        isCollapsed ? "justify-center p-2" : "px-2.5",
        isActive
          ? "text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span>{item.title}</span>}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {item.title}
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}
