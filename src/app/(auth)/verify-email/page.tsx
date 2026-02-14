import { Suspense } from "react"
import { Metadata } from "next"
import { VerifyEmailForm } from "./verify-email-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "E-Mail bestätigen",
  description: "Bestätige deine E-Mail-Adresse mit dem Code",
}

function VerifyEmailFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">E-Mail bestätigen</h1>
        <p className="text-muted-foreground">
          Gib den 8-stelligen Code aus deiner E-Mail ein
        </p>
      </div>
      <Suspense fallback={<VerifyEmailFormSkeleton />}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  )
}
