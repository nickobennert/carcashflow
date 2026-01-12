import { Suspense } from "react"
import { Metadata } from "next"
import { LoginForm } from "./login-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Anmelden",
  description: "Melde dich bei Carcashflow an",
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Willkommen zurück</h1>
        <p className="text-muted-foreground">
          Melde dich an, um fortzufahren
        </p>
      </div>
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
