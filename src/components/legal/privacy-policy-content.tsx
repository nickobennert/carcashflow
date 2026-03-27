import { Separator } from "@/components/ui/separator"

export function PrivacyPolicyContent() {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      {/* 1. Verantwortlicher */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">1. Verantwortlicher</h2>
        <p className="text-sm text-muted-foreground">
          <strong>NICKO BENNERT CONSULTING LTD</strong><br />
          Tepeleniou 13<br />
          TEPELENIOU COURT - 2nd floor<br />
          8010 Paphos<br />
          CYPRUS<br /><br />
          Vertretungsberechtigter Gesellschafter: Nicko Bennert<br />
          USt-IdNr.: CY60227472K<br /><br />
          E-Mail:{" "}
          <a href="mailto:nicko-bennert@web.de" className="text-primary hover:underline">
            nicko-bennert@web.de
          </a><br />
          Telefon: +49 (0) 1511 6837344
        </p>
      </section>

      <Separator className="my-4" />

      {/* 2. Übersicht */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">2. Übersicht der Verarbeitungen</h2>
        <p className="text-sm text-muted-foreground">
          Die nachfolgende Übersicht fasst die Arten der verarbeiteten Daten und die Zwecke ihrer
          Verarbeitung zusammen und verweist auf die betroffenen Personen.
        </p>

        <h3 className="text-sm font-medium mt-4">Arten der verarbeiteten Daten</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Bestandsdaten (z.B. Namen, Adressen)</li>
          <li>Kontaktdaten (z.B. E-Mail)</li>
          <li>Inhaltsdaten (z.B. Texteingaben, Routen)</li>
          <li>Nutzungsdaten (z.B. besuchte Seiten, Zugriffszeiten)</li>
          <li>Meta-/Kommunikationsdaten (z.B. IP-Adressen)</li>
        </ul>

        <h3 className="text-sm font-medium mt-4">Kategorien betroffener Personen</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Nutzer der Plattform</li>
          <li>Interessenten</li>
        </ul>

        <h3 className="text-sm font-medium mt-4">Zwecke der Verarbeitung</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Bereitstellung der Plattform-Funktionen</li>
          <li>Kontaktaufnahme zwischen Nutzern</li>
          <li>Sicherheitsmaßnahmen</li>
        </ul>
      </section>

      <Separator className="my-4" />

      {/* 3. Rechtsgrundlagen */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">3. Rechtsgrundlagen</h2>
        <p className="text-sm text-muted-foreground">
          Im Folgenden erhalten Sie eine Übersicht der Rechtsgrundlagen der DSGVO, auf deren Basis
          wir personenbezogene Daten verarbeiten:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
          <li>
            <strong>Vertragserfüllung und vorvertragliche Anfragen (Art. 6 Abs. 1 S. 1 lit. b DSGVO)</strong> –
            Die Verarbeitung ist für die Erfüllung eines Vertrags, dessen Vertragspartei die betroffene
            Person ist, oder zur Durchführung vorvertraglicher Maßnahmen erforderlich.
          </li>
          <li>
            <strong>Berechtigte Interessen (Art. 6 Abs. 1 S. 1 lit. f DSGVO)</strong> –
            Die Verarbeitung ist zur Wahrung der berechtigten Interessen des Verantwortlichen oder
            eines Dritten erforderlich.
          </li>
          <li>
            <strong>Einwilligung (Art. 6 Abs. 1 S. 1 lit. a DSGVO)</strong> –
            Die betroffene Person hat ihre Einwilligung in die Verarbeitung der sie betreffenden
            personenbezogenen Daten gegeben.
          </li>
        </ul>
      </section>

      <Separator className="my-4" />

      {/* 4. Datenerfassung */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">4. Datenerfassung auf dieser Website</h2>

        <h3 className="text-sm font-medium mt-4">Server-Log-Dateien</h3>
        <p className="text-sm text-muted-foreground">
          Der Provider der Seiten erhebt und speichert automatisch Informationen in sogenannten
          Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Browsertyp und Browserversion</li>
          <li>Verwendetes Betriebssystem</li>
          <li>Referrer URL</li>
          <li>Hostname des zugreifenden Rechners</li>
          <li>Uhrzeit der Serveranfrage</li>
          <li>IP-Adresse</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">
          Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
          Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
        </p>

        <h3 className="text-sm font-medium mt-4">Cookies</h3>
        <p className="text-sm text-muted-foreground">
          Unsere Website verwendet ausschließlich technisch notwendige Cookies für die
          Authentifizierung und Session-Verwaltung. Es werden keine Tracking- oder Werbe-Cookies
          eingesetzt.
        </p>

        <h3 className="text-sm font-medium mt-4">Registrierung und Nutzerkonto</h3>
        <p className="text-sm text-muted-foreground">
          Bei der Registrierung werden folgende Daten erhoben:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>E-Mail-Adresse</li>
          <li>Passwort (verschlüsselt gespeichert)</li>
          <li>Benutzername</li>
          <li>Vor- und Nachname (optional)</li>
          <li>Wohnort (optional)</li>
          <li>Profilbild (optional)</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">
          Diese Daten werden zur Bereitstellung der Plattform-Funktionen verarbeitet
          (Art. 6 Abs. 1 lit. b DSGVO).
        </p>

        <h3 className="text-sm font-medium mt-4">Mitfahrangebote und Nachrichten</h3>
        <p className="text-sm text-muted-foreground">
          Von Nutzern erstellte Mitfahrangebote, Gesuche und Nachrichten werden gespeichert,
          um die Kernfunktionalität der Plattform zu ermöglichen. Diese Daten sind für andere
          registrierte Nutzer sichtbar.
        </p>
      </section>

      <Separator className="my-4" />

      {/* 5. Drittanbieter */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">5. Drittanbieter-Dienste</h2>

        <h3 className="text-sm font-medium mt-4">Vercel (Hosting)</h3>
        <p className="text-sm text-muted-foreground">
          Unsere Website wird bei Vercel Inc. (San Francisco, USA) gehostet. Vercel verarbeitet
          Server-Log-Daten und IP-Adressen zur Bereitstellung der Website.
        </p>

        <h3 className="text-sm font-medium mt-4">Supabase (Datenbank & Authentifizierung)</h3>
        <p className="text-sm text-muted-foreground">
          Wir nutzen Supabase für die Speicherung von Nutzerdaten und die Authentifizierung.
          Die Daten werden auf EU-Servern gespeichert.
        </p>

        <h3 className="text-sm font-medium mt-4">OpenRouteService (Routenberechnung)</h3>
        <p className="text-sm text-muted-foreground">
          Für die Routenberechnung nutzen wir OpenRouteService. Dabei werden Standortdaten
          (Start- und Zielpunkte) für die Routenberechnung übertragen.
        </p>
      </section>

      <Separator className="my-4" />

      {/* 6. Betroffenenrechte */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">6. Betroffenenrechte</h2>
        <p className="text-sm text-muted-foreground">
          Als betroffene Person haben Sie folgende Rechte:
        </p>

        <h3 className="text-sm font-medium mt-4">Auskunftsrecht (Art. 15 DSGVO)</h3>
        <p className="text-sm text-muted-foreground">
          Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob betreffende Daten
          verarbeitet werden und auf Auskunft über diese Daten sowie weitere Informationen.
        </p>

        <h3 className="text-sm font-medium mt-4">Recht auf Berichtigung (Art. 16 DSGVO)</h3>
        <p className="text-sm text-muted-foreground">
          Sie haben das Recht, die Vervollständigung oder Berichtigung unrichtiger Sie
          betreffender Daten zu verlangen.
        </p>

        <h3 className="text-sm font-medium mt-4">Recht auf Löschung (Art. 17 DSGVO)</h3>
        <p className="text-sm text-muted-foreground">
          Sie haben das Recht, zu verlangen, dass Sie betreffende Daten unverzüglich
          gelöscht werden. Sie können Ihren Account jederzeit in den Einstellungen löschen.
        </p>

        <h3 className="text-sm font-medium mt-4">Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</h3>
        <p className="text-sm text-muted-foreground">
          Sie haben das Recht, Ihre Daten in einem strukturierten, gängigen und
          maschinenlesbaren Format zu erhalten. In der App können Sie unter
          Einstellungen → Datenschutz Ihre Daten als JSON-Datei exportieren.
        </p>

        <h3 className="text-sm font-medium mt-4">Widerspruchsrecht (Art. 21 DSGVO)</h3>
        <p className="text-sm text-muted-foreground">
          Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben,
          jederzeit gegen die Verarbeitung Sie betreffender Daten Widerspruch einzulegen.
        </p>

        <h3 className="text-sm font-medium mt-4">Beschwerderecht bei einer Aufsichtsbehörde</h3>
        <p className="text-sm text-muted-foreground">
          Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren,
          wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen die DSGVO verstößt.
        </p>
      </section>

      <Separator className="my-4" />

      {/* 7. SSL */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">7. SSL-Verschlüsselung</h2>
        <p className="text-sm text-muted-foreground">
          Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung
          vertraulicher Inhalte eine SSL-Verschlüsselung. Eine verschlüsselte Verbindung
          erkennen Sie daran, dass die Adresszeile des Browsers von &quot;http://&quot; auf &quot;https://&quot;
          wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
        </p>
      </section>

      <Separator className="my-4" />

      {/* 8. Kontakt */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">8. Kontakt für Datenschutzanfragen</h2>
        <p className="text-sm text-muted-foreground">
          Für Fragen zum Datenschutz oder zur Ausübung Ihrer Betroffenenrechte
          wenden Sie sich bitte an:
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>NICKO BENNERT CONSULTING LTD</strong><br />
          Nicko Bennert<br />
          E-Mail:{" "}
          <a href="mailto:nicko-bennert@web.de" className="text-primary hover:underline">
            nicko-bennert@web.de
          </a><br />
          Telefon: +49 (0) 1511 6837344
        </p>
      </section>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Stand: Februar 2026
      </p>
    </div>
  )
}
