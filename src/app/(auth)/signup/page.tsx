import { Metadata } from "next"
import { SignupForm } from "./signup-form"

export const metadata: Metadata = {
  title: "Registrieren",
  description: "Erstelle dein Carcashflow-Konto und sichere dir den Beta-Zugang",
}

export default function SignupPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Konto erstellen</h1>
        <p className="text-muted-foreground">
          Sichere dir deinen Beta-Zugang und finde deine nächste Mitfahrgelegenheit
        </p>
      </div>
      <SignupForm />
    </div>
  )
}
