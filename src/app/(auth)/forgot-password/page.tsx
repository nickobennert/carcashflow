import { Suspense } from "react"
import { Metadata } from "next"
import { ForgotPasswordForm } from "./forgot-password-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Passwort vergessen",
  description: "Setze dein Passwort zurück",
}

function ForgotPasswordFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Passwort vergessen?</h1>
        <p className="text-muted-foreground">
          Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen
        </p>
      </div>
      <Suspense fallback={<ForgotPasswordFormSkeleton />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}
