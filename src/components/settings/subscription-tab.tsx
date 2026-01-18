"use client"

import { useState } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  CreditCard,
  Check,
  Crown,
  Sparkles,
  ExternalLink,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { RedeemCodeForm } from "@/components/promo"
import type { Profile } from "@/types"

interface SubscriptionTabProps {
  profile: Profile
  onUpdate: (profile: Profile) => void
}

const plans = [
  {
    id: "trial",
    name: "Testphase",
    price: 0,
    period: "30 Tage",
    features: [
      "5 Routen pro Monat",
      "Unbegrenzte Nachrichten",
    ],
  },
  {
    id: "basic",
    name: "Basis",
    price: 4.99,
    period: "pro Monat",
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
    features: [
      "Unbegrenzte Routen",
      "Unbegrenzte Nachrichten",
      "Prioritäts-Support",
      "Keine Werbung",
    ],
    popular: true,
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: 49.99,
    period: "einmalig",
    features: [
      "Alle Premium-Features",
      "Lebenslanger Zugang",
      "Früher Zugang zu neuen Features",
      "VIP-Support",
    ],
  },
]

export function SubscriptionTab({ profile }: SubscriptionTabProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const currentTier = profile.subscription_tier || "trial"
  const status = profile.subscription_status || "trialing"
  const isLifetime = profile.is_lifetime
  const trialEndsAt = profile.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : null
  const currentPeriodEnd = profile.current_period_end
    ? new Date(profile.current_period_end)
    : null

  const currentPlan = plans.find((p) => p.id === currentTier)

  // Calculate trial days remaining
  const trialDaysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0
  const trialProgress = trialEndsAt
    ? Math.min(100, ((30 - trialDaysRemaining) / 30) * 100)
    : 0

  async function handleUpgrade(planId: string) {
    setIsLoading(planId)

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) throw new Error("Failed to create checkout session")

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Error creating checkout:", error)
      toast.error("Fehler beim Erstellen der Checkout-Session")
    } finally {
      setIsLoading(null)
    }
  }

  async function handleManageSubscription() {
    setIsLoading("manage")

    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to create portal session")

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Error opening portal:", error)
      toast.error("Fehler beim Öffnen des Kundenportals")
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isLifetime ? (
                  <Crown className="h-5 w-5 text-yellow-500" />
                ) : (
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                )}
                Dein aktueller Plan
              </CardTitle>
              <CardDescription>
                {isLifetime
                  ? "Du hast lebenslangen Zugang zu allen Features"
                  : status === "trialing"
                  ? "Du befindest dich in der kostenlosen Testphase"
                  : "Verwalte dein Abonnement"}
              </CardDescription>
            </div>

            <Badge
              variant="secondary"
              className={cn(
                status === "active" && "bg-emerald-500/10 text-emerald-600",
                status === "trialing" && "bg-blue-500/10 text-blue-600",
                status === "canceled" && "bg-amber-500/10 text-amber-600",
                status === "frozen" && "bg-red-500/10 text-red-600"
              )}
            >
              {status === "active" && "Aktiv"}
              {status === "trialing" && "Testphase"}
              {status === "canceled" && "Gekündigt"}
              {status === "frozen" && "Eingefroren"}
              {status === "lifetime" && "Lifetime"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan Info */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <p className="font-semibold text-lg">{currentPlan?.name || "Unbekannt"}</p>
              {currentPlan && (
                <p className="text-sm text-muted-foreground">
                  {currentPlan.price === 0
                    ? "Kostenlos"
                    : `${currentPlan.price.toFixed(2).replace(".", ",")} € ${currentPlan.period}`}
                </p>
              )}
            </div>
            {isLifetime && <Crown className="h-8 w-8 text-yellow-500" />}
          </div>

          {/* Trial Progress */}
          {status === "trialing" && trialEndsAt && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Testphase endet am
                </span>
                <span className="font-medium">
                  {format(trialEndsAt, "d. MMMM yyyy", { locale: de })}
                </span>
              </div>
              <Progress value={trialProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {trialDaysRemaining > 0
                  ? `Noch ${trialDaysRemaining} ${trialDaysRemaining === 1 ? "Tag" : "Tage"} verbleibend`
                  : "Deine Testphase ist abgelaufen"}
              </p>
            </div>
          )}

          {/* Active Subscription End Date */}
          {status === "active" && currentPeriodEnd && !isLifetime && (
            <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Nächste Abrechnung</span>
              <span className="font-medium">
                {format(currentPeriodEnd, "d. MMMM yyyy", { locale: de })}
              </span>
            </div>
          )}

          {/* Canceled Notice */}
          {status === "canceled" && currentPeriodEnd && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-600">Abonnement gekündigt</p>
                <p className="text-sm text-amber-600/80">
                  Du hast noch bis zum{" "}
                  {format(currentPeriodEnd, "d. MMMM yyyy", { locale: de })}{" "}
                  Zugang zu allen Features.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!isLifetime && (
              <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Plan auswählen
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[60vw] max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Wähle deinen Plan</DialogTitle>
                    <DialogDescription>
                      Wähle den Plan, der am besten zu dir passt
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 sm:grid-cols-3 mt-4">
                    {plans
                      .filter((plan) => plan.id !== "trial")
                      .map((plan) => {
                        const isCurrent = plan.id === currentTier
                        const isUpgrade =
                          plans.findIndex((p) => p.id === plan.id) >
                          plans.findIndex((p) => p.id === currentTier)

                        return (
                          <div
                            key={plan.id}
                            className={cn(
                              "relative rounded-xl p-5 transition-all",
                              plan.popular
                                ? "animated-border-gradient"
                                : "border",
                              isCurrent && "bg-muted/50"
                            )}
                          >
                            {plan.popular && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                <Badge className="gap-1 bg-emerald-500 hover:bg-emerald-500">
                                  <Sparkles className="h-3 w-3" />
                                  Beliebt
                                </Badge>
                              </div>
                            )}

                            <div className="mb-4">
                              <h3 className="font-semibold text-lg">{plan.name}</h3>
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-bold">
                                  {plan.price.toFixed(2).replace(".", ",")} €
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {plan.period}
                                </span>
                              </div>
                            </div>

                            <ul className="space-y-2 mb-5">
                              {plan.features.map((feature) => (
                                <li
                                  key={feature}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>

                            <Button
                              className={cn(
                                "w-full",
                                plan.popular && "bg-emerald-500 hover:bg-emerald-600"
                              )}
                              variant={plan.popular ? "default" : "outline"}
                              disabled={isCurrent || isLoading === plan.id}
                              onClick={() => handleUpgrade(plan.id)}
                            >
                              {isLoading === plan.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : isCurrent ? (
                                "Aktueller Plan"
                              ) : isUpgrade ? (
                                "Upgraden"
                              ) : (
                                "Auswählen"
                              )}
                            </Button>
                          </div>
                        )
                      })}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {profile.stripe_subscription_id && !isLifetime && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleManageSubscription}
                disabled={isLoading === "manage"}
              >
                {isLoading === "manage" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Abonnement verwalten
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promo Code Redemption */}
      <RedeemCodeForm onSuccess={() => window.location.reload()} />
    </div>
  )
}
