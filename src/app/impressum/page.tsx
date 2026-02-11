import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Impressum | Fahr mit!",
  description: "Impressum und rechtliche Angaben von Fahr mit!",
}

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8 px-4">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Startseite
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Impressum</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-zinc dark:prose-invert max-w-none">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Angaben gemäß § 5 DDG</h2>
              <p className="text-muted-foreground">
                <strong>NICKO BENNERT CONSULTING LTD</strong><br />
                Tepeleniou 13<br />
                TEPELENIOU COURT - 2nd floor<br />
                8010 Paphos<br />
                CYPRUS
              </p>
            </section>

            <Separator className="my-6" />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Kontakt</h2>
              <p className="text-muted-foreground">
                E-Mail:{" "}
                <a href="mailto:nicko-bennert@web.de" className="text-primary hover:underline">
                  nicko-bennert@web.de
                </a><br />
                Telefon: +49 (0) 1511 6837344
              </p>
            </section>

            <Separator className="my-6" />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Vertretungsberechtigte Gesellschafter</h2>
              <p className="text-muted-foreground">
                Nicko Bennert
              </p>
            </section>

            <Separator className="my-6" />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Umsatzsteuer-Identifikationsnummer</h2>
              <p className="text-muted-foreground">
                CY60227472K
              </p>
            </section>

            <Separator className="my-6" />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Streitschlichtung</h2>
              <p className="text-sm text-muted-foreground">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                Unsere E-Mail-Adresse finden Sie oben im Impressum. Wir sind nicht bereit oder verpflichtet,
                an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Haftung für Inhalte</h2>
              <p className="text-sm text-muted-foreground">
                Die Inhalte unserer Seiten wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit,
                Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine Gewähr. Als
                Diensteanbieter sind wir gemäß den allgemeinen Gesetzen für eigene Inhalte auf diesen Seiten
                verantwortlich. Gemäß den Bestimmungen des Digitalen-Dienste-Gesetzes (DDG) sind wir jedoch
                nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder
                aktiv nach Umständen zu suchen, die auf eine rechtswidrige Tätigkeit hinweisen.
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
                allgemeinen Gesetzen bleiben davon unberührt.
              </p>
              <p className="text-sm text-muted-foreground">
                Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten
                Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden
                wir diese Inhalte umgehend entfernen.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Haftung für Links</h2>
              <p className="text-sm text-muted-foreground">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
                Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
                Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
                Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf
                mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der
                Verlinkung nicht erkennbar.
              </p>
              <p className="text-sm text-muted-foreground">
                Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
                Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
                Rechtsverletzungen werden wir derartige Links umgehend entfernen.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Urheberrecht</h2>
              <p className="text-sm text-muted-foreground">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
                dem Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
                der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
                Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind
                nur für den privaten, nicht kommerziellen Gebrauch gestattet.
              </p>
              <p className="text-sm text-muted-foreground">
                Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
                Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
                gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden,
                bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen
                werden wir derartige Inhalte umgehend entfernen.
              </p>
            </section>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Stand: Februar 2026
        </p>
      </div>
    </div>
  )
}
