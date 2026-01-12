import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface PromoCode {
  id: string
  code: string
  type: string
  value: number | null
  duration_months: number | null
  max_uses: number | null
  current_uses: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
}

// POST /api/promo-codes/redeem - Redeem a promo code
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      )
    }

    // Find the promo code
    const { data: promoCodeData, error: codeError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single()

    if (codeError || !promoCodeData) {
      return NextResponse.json(
        { error: "Ungültiger Code" },
        { status: 404 }
      )
    }

    const promoCode = promoCodeData as PromoCode

    // Check if code has expired
    if (promoCode.valid_until && new Date(promoCode.valid_until) < new Date()) {
      return NextResponse.json(
        { error: "Code ist abgelaufen" },
        { status: 400 }
      )
    }

    // Check if code hasn't started yet
    if (new Date(promoCode.valid_from) > new Date()) {
      return NextResponse.json(
        { error: "Code ist noch nicht gültig" },
        { status: 400 }
      )
    }

    // Check if max uses reached
    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json(
        { error: "Code wurde bereits zu oft eingelöst" },
        { status: 400 }
      )
    }

    // Check if user already redeemed this code
    const { data: existingRedemption } = await supabase
      .from("code_redemptions")
      .select("id")
      .eq("code_id", promoCode.id)
      .eq("user_id", user.id)
      .single()

    if (existingRedemption) {
      return NextResponse.json(
        { error: "Du hast diesen Code bereits eingelöst" },
        { status: 400 }
      )
    }

    // Create the redemption (trigger will increment usage count)
    const { error: redemptionError } = await supabase
      .from("code_redemptions")
      .insert({
        code_id: promoCode.id,
        user_id: user.id,
      } as never)

    if (redemptionError) throw redemptionError

    // Apply the promo code effect to the user's profile
    const profileUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    switch (promoCode.type) {
      case "lifetime_free":
        profileUpdate.is_lifetime = true
        profileUpdate.subscription_tier = "lifetime"
        profileUpdate.subscription_status = "active"
        break

      case "free_months":
        if (promoCode.value) {
          const currentDate = new Date()
          const newTrialEnd = new Date(currentDate)
          newTrialEnd.setMonth(newTrialEnd.getMonth() + promoCode.value)
          profileUpdate.trial_ends_at = newTrialEnd.toISOString()
          profileUpdate.subscription_status = "trialing"
        }
        break

      case "percent_discount":
      case "fixed_discount":
        // These would be applied at checkout via Stripe
        // Store the discount info for later use
        break
    }

    if (Object.keys(profileUpdate).length > 1) {
      await supabase
        .from("profiles")
        .update(profileUpdate as never)
        .eq("id", user.id)
    }

    // Return success with code details
    return NextResponse.json({
      success: true,
      message: getSuccessMessage(promoCode),
      code: {
        type: promoCode.type,
        value: promoCode.value,
        duration_months: promoCode.duration_months,
      },
    })
  } catch (error) {
    console.error("Error redeeming promo code:", error)
    return NextResponse.json(
      { error: "Fehler beim Einlösen des Codes" },
      { status: 500 }
    )
  }
}

function getSuccessMessage(code: PromoCode): string {
  switch (code.type) {
    case "lifetime_free":
      return "Herzlichen Glückwunsch! Du hast lebenslangen kostenlosen Zugang erhalten."
    case "free_months":
      return `Du hast ${code.value} Monate kostenlos erhalten!`
    case "percent_discount":
      return `Du erhältst ${code.value}% Rabatt auf dein Abonnement.`
    case "fixed_discount":
      return `Du erhältst ${((code.value || 0) / 100).toFixed(2)}€ Rabatt.`
    default:
      return "Code erfolgreich eingelöst!"
  }
}
