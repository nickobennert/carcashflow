import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Impressum | Carcashflow",
  description: "Impressum und rechtliche Angaben von Carcashflow",
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
              <h2 className="text-lg font-semibold">Angaben gemäß § 5 TMG</h2>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Bitte ergänzen Sie hier Ihre Angaben:
                </p>
              </div>
              <p className="text-muted-foreground">
                [FIRMENNAME / BETREIBER]<br />
                [STRASSE HAUSNUMMER]<br />
                [PLZ ORT]<br />
                Deutschland
              </p>
            </section>

            <Separator className="my-6" />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Kontakt</h2>
              <p className="text-muted-foreground">
                E-Mail: [E-MAIL-ADRESSE]<br />
                Telefon: [TELEFONNUMMER] (optional)
              </p>
            </section>

            <Separator className="my-6" />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">
                Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
              </h2>
              <p className="text-muted-foreground">
                [NAME DES VERANTWORTLICHEN]<br />
                [STRASSE HAUSNUMMER]<br />
                [PLZ ORT]
              </p>
            </section>

            <Separator className="my-6" />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Haftung für Inhalte</h2>
              <p className="text-sm text-muted-foreground">
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
                nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
                Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
                Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
                Tätigkeit hinweisen.
              </p>
              <p className="text-sm text-muted-foreground">
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
                allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
                erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
                Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend
                entfernen.
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
                dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
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
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Stand: Januar 2026
        </p>
      </div>
    </div>
  )
}
