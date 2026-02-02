"use client"

import { usePathname } from "next/navigation"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { BugReportDrawer } from "@/components/bug-report"

interface AppShellProps {
  children: React.ReactNode
  user?: {
    name: string
    email: string
    avatar?: string
  } | null
}

// Routes that need fixed height layout (no page scroll, internal scroll only)
const fixedHeightRoutes = ["/messages/"]

export function AppShell({
  children,
  user,
}: AppShellProps) {
  const pathname = usePathname()

  // Check if current route needs fixed height (chat views)
  const isFixedHeight = fixedHeightRoutes.some(route => pathname.startsWith(route) && pathname !== "/messages")

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <Header user={user} />

      {/* Content Area */}
      <div className={isFixedHeight ? "flex h-[calc(100vh-3.5rem)]" : "flex min-h-[calc(100vh-3.5rem)]"}>
        {/* Desktop Sidebar - sticky */}
        <aside className="hidden shrink-0 border-r md:block sticky top-14 h-[calc(100vh-3.5rem)]">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-hidden">
          {isFixedHeight ? (
            // Fixed height layout for chat views (internal scroll)
            <div className="h-full overflow-hidden">
              {children}
            </div>
          ) : (
            // Standard layout - page scrolls naturally
            <div className="mx-auto max-w-7xl py-6 px-4 md:px-6 lg:px-8 overflow-x-hidden">
              {children}
            </div>
          )}
        </main>
      </div>

      {/* Bug Report Floating Button */}
      <BugReportDrawer />
    </div>
  )
}
