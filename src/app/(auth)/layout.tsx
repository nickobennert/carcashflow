import Link from "next/link"
import Image from "next/image"

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
          <Link href="/" className="flex items-center">
            {/* Dark mode: show light logo */}
            <Image
              src="/carcashflow-fahrmit-light.svg"
              alt="Fahr mit!"
              width={120}
              height={28}
              className="hidden dark:block"
              priority
            />
            {/* Light mode: show dark logo */}
            <Image
              src="/carcashflow-fahrmit-dark.svg"
              alt="Fahr mit!"
              width={120}
              height={28}
              className="block dark:hidden"
              priority
            />
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
