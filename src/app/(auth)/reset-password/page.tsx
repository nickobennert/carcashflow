import { Suspense } from "react"
import { Metadata } from "next"
import { ResetPasswordForm } from "./reset-password-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Neues Passwort",
  description: "Setze dein neues Passwort",
}

function ResetPasswordFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Neues Passwort</h1>
        <p className="text-muted-foreground">
          Gib dein neues Passwort ein
        </p>
      </div>
      <Suspense fallback={<ResetPasswordFormSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
