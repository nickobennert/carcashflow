"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  Check,
  Crown,
  Sparkles,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations"
import { RedeemCodeForm } from "@/components/promo"
import type { Profile } from "@/types"

const plans = [
  {
    id: "basic",
    name: "Basis",
    price: 4.99,
    period: "pro Monat",
    description: "Für gelegentliche Fahrer",
    features: [
      "20 Routen pro Monat",
      "Unbegrenzte Nachrichten",
      "Erweiterte Filter",
    ],
    popular: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: 9.99,
    period: "pro Monat",
    description: "Für aktive Nutzer",
    features: [
      "Unbegrenzte Routen",
      "Unbegrenzte Nachrichten",
      "Prioritäts-Support",
      "Keine Werbung",
      "Früher Zugang zu Features",
    ],
    popular: true,
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: 49.99,
    period: "einmalig",
    description: "Einmal zahlen, für immer nutzen",
    features: [
      "Alle Premium-Features",
      "Lebenslanger Zugang",
      "Früher Zugang zu neuen Features",
      "VIP-Support",
      "Exklusive Community",
    ],
    highlight: true,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (data) {
        setProfile(data as Profile)
      }
      setIsLoading(false)
    }

    loadProfile()
  }, [router, supabase])

  async function handleCheckout(planId: string) {
    setCheckoutLoading(planId)

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) throw new Error("Failed to create checkout")

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error("Fehler beim Erstellen der Checkout-Session")
    } finally {
      setCheckoutLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentTier = profile?.subscription_tier || "trial"
  const isLifetime = profile?.is_lifetime

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          Pricing
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          Wähle deinen Plan
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {isLifetime
            ? "Du hast bereits lebenslangen Zugang zu allen Features!"
            : "Starte mit der kostenlosen Testphase und upgrade jederzeit auf einen bezahlten Plan."}
        </p>
      </div>

      {isLifetime ? (
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <Crown className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">Lifetime Member</h2>
            <p className="text-muted-foreground">
              Du genießt lebenslangen Zugang zu allen Premium-Features. Danke für
              deine Unterstützung!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Plans Grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-6 md:grid-cols-3 mb-12"
          >
            {plans.map((plan) => {
              const isCurrent = plan.id === currentTier

              return (
                <motion.div key={plan.id} variants={staggerItem}>
                  <Card
                    className={cn(
                      "relative h-full flex flex-col",
                      plan.popular && "border-primary shadow-lg",
                      plan.highlight && "border-yellow-500"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="gap-1 bg-primary">
                          <Sparkles className="h-3 w-3" />
                          Beliebt
                        </Badge>
                      </div>
                    )}
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="gap-1 bg-yellow-500 text-yellow-950">
                          <Crown className="h-3 w-3" />
                          Best Value
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col">
                      <div className="text-center mb-6">
                        <span className="text-4xl font-bold">
                          {plan.price.toFixed(2).replace(".", ",")} €
                        </span>
                        <span className="text-muted-foreground ml-1">
                          {plan.period}
                        </span>
                      </div>

                      <ul className="space-y-3 flex-1 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full"
                        variant={plan.popular || plan.highlight ? "default" : "outline"}
                        disabled={isCurrent || checkoutLoading === plan.id}
                        onClick={() => handleCheckout(plan.id)}
                      >
                        {checkoutLoading === plan.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : isCurrent ? (
                          "Aktueller Plan"
                        ) : (
                          <>
                            Jetzt starten
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Promo Code */}
          <div className="max-w-md mx-auto">
            <RedeemCodeForm onSuccess={() => window.location.reload()} />
          </div>
        </>
      )}

      {/* FAQ or Info */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>
          Alle Preise inkl. MwSt. Du kannst jederzeit kündigen.
        </p>
        <p className="mt-1">
          Fragen? Schreib uns an{" "}
          <a href="mailto:support@carcashflow.de" className="underline">
            support@carcashflow.de
          </a>
        </p>
      </div>
    </motion.div>
  )
}
