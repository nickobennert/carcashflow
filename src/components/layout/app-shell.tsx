"use client"

import { usePathname } from "next/navigation"
import { Header } from "./header"
import { Sidebar } from "./sidebar"

interface AppShellProps {
  children: React.ReactNode
  user?: {
    name: string
    email: string
    avatar?: string
  } | null
  unreadMessages?: number
  unreadNotifications?: number
}

// Routes that need full-width layout (no container padding)
const fullWidthRoutes = ["/messages/"]

export function AppShell({
  children,
  user,
  unreadMessages,
  unreadNotifications,
}: AppShellProps) {
  const pathname = usePathname()

  // Check if current route needs full-width layout
  const isFullWidth = fullWidthRoutes.some(route => pathname.startsWith(route) && pathname !== "/messages")

  return (
    <div className="relative min-h-screen bg-background">
      <Header
        user={user}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
      />

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r md:block">
          <div className="h-full overflow-y-auto">
            <Sidebar />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {isFullWidth ? (
            // Full-width layout for chat views
            <div className="h-full">
              {children}
            </div>
          ) : (
            // Standard layout with container
            <div className="h-full overflow-y-auto">
              <div className="mx-auto max-w-7xl py-6 px-4 md:px-6 lg:px-8">
                {children}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
