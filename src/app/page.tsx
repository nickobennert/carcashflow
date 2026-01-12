import Link from "next/link"
import { Car, ArrowRight, Users, MapPin, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="font-bold">Carcashflow</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Anmelden
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Registrieren</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center md:py-24">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Mitfahrbörse für{" "}
            <span className="text-primary">Schulungsteilnehmer</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Organisiere Rückfahrten effizient mit anderen Teilnehmern. Biete
            Fahrten an oder finde Mitfahrgelegenheiten.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Kostenlos starten
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Ich habe bereits ein Konto
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/50 py-16 md:py-24">
        <div className="container px-4">
          <h2 className="mb-12 text-center text-2xl font-bold md:text-3xl">
            So funktioniert&apos;s
          </h2>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 rounded-full bg-offer/10 p-3">
                  <MapPin className="h-6 w-6 text-offer" />
                </div>
                <h3 className="mb-2 font-semibold">Route angeben</h3>
                <p className="text-sm text-muted-foreground">
                  Gib deinen Start- und Zielort an. Füge Zwischenstopps hinzu,
                  wenn du auf dem Weg jemanden mitnehmen kannst.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 rounded-full bg-request/10 p-3">
                  <Users className="h-6 w-6 text-request" />
                </div>
                <h3 className="mb-2 font-semibold">Kontakt aufnehmen</h3>
                <p className="text-sm text-muted-foreground">
                  Finde passende Angebote oder Gesuche und nimm direkt Kontakt
                  mit anderen Teilnehmern auf.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Sicher & einfach</h3>
                <p className="text-sm text-muted-foreground">
                  Nur verifizierte Schulungsteilnehmer. Deine Kontaktdaten
                  bleiben privat bis du sie teilen möchtest.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            Bereit loszufahren?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-muted-foreground">
            Registriere dich jetzt kostenlos und finde deine nächste
            Mitfahrgelegenheit.
          </p>
          <Link href="/signup">
            <Button size="lg">
              Jetzt registrieren
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <Car className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Carcashflow
            </span>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
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
        </div>
      </footer>
    </div>
  )
}
