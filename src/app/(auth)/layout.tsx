import Link from "next/link"
import { Car } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple Header */}
      <header className="border-b">
        <div className="container flex h-14 items-center px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="font-bold">Carcashflow</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container flex justify-center gap-4 px-4 text-sm text-muted-foreground">
          <Link href="/impressum" className="hover:underline">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:underline">
            Datenschutz
          </Link>
          <Link href="/agb" className="hover:underline">
            AGB
          </Link>
        </div>
      </footer>
    </div>
  )
}
