"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ConnectionButton } from "@/components/connections/connection-button"
import { Skeleton } from "@/components/ui/skeleton"

interface ProfileConnectionButtonProps {
  profileUserId: string
}

export function ProfileConnectionButton({ profileUserId }: ProfileConnectionButtonProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setCurrentUserId(user?.id || null)
      setIsLoading(false)
    }

    getCurrentUser()
  }, [supabase])

  // Show nothing if not logged in
  if (!isLoading && !currentUserId) {
    return null
  }

  // Show loading skeleton
  if (isLoading) {
    return <Skeleton className="h-10 w-28" />
  }

  // Don't show button for own profile
  if (currentUserId === profileUserId) {
    return null
  }

  // Type guard - at this point currentUserId must be a string
  if (!currentUserId) {
    return null
  }

  return (
    <ConnectionButton
      userId={profileUserId}
      currentUserId={currentUserId}
      variant="default"
    />
  )
}
