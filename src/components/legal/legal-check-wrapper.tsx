"use client"

import { useState, useEffect } from "react"
import { LegalAcceptanceModal } from "./legal-acceptance-modal"
import { InsuranceNoticeModal } from "./insurance-notice-modal"

export function LegalCheckWrapper() {
  const [isLoading, setIsLoading] = useState(true)
  const [needsRideshareTerms, setNeedsRideshareTerms] = useState(false)
  const [needsInsuranceNotice, setNeedsInsuranceNotice] = useState(false)

  useEffect(() => {
    checkAllAcceptances()
  }, [])

  async function checkAllAcceptances() {
    try {
      const [rideshareRes, insuranceRes] = await Promise.all([
        fetch("/api/legal?type=rideshare_terms"),
        fetch("/api/legal?type=insurance_notice"),
      ])

      const rideshareData = await rideshareRes.json()
      const insuranceData = await insuranceRes.json()

      setNeedsRideshareTerms(!rideshareData.hasAccepted)
      setNeedsInsuranceNotice(!insuranceData.hasAccepted)
    } catch (error) {
      console.error("Error checking legal acceptances:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return null

  if (needsRideshareTerms) {
    return (
      <LegalAcceptanceModal
        onAccepted={() => setNeedsRideshareTerms(false)}
      />
    )
  }

  if (needsInsuranceNotice) {
    return (
      <InsuranceNoticeModal
        open={true}
        onAccepted={() => setNeedsInsuranceNotice(false)}
      />
    )
  }

  return null
}
