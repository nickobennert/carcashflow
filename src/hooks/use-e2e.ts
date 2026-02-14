"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getE2EService, E2EService } from "@/lib/crypto/e2e-service"
import { generateKeyFingerprint } from "@/lib/crypto/key-generation"
import { getIdentityKeys } from "@/lib/crypto/key-storage"

interface UseE2EOptions {
  userId: string
  autoInitialize?: boolean
}

interface UseE2EReturn {
  // Status
  isInitialized: boolean
  isInitializing: boolean
  error: string | null

  // Key info
  fingerprint: string | null

  // Actions
  initialize: () => Promise<string | null>
  encryptMessage: (conversationId: string, plaintext: string) => Promise<string>
  decryptMessage: (conversationId: string, encrypted: string) => Promise<string>
  decryptMessages: (conversationId: string, messages: Array<{ id: string; content: string }>) => Promise<Map<string, string>>
  establishKey: (conversationId: string, otherUserId: string, otherPublicKey: string) => Promise<void>
  hasKeyForConversation: (conversationId: string) => Promise<boolean>
}

export function useE2E({ userId, autoInitialize = true }: UseE2EOptions): UseE2EReturn {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const serviceRef = useRef<E2EService | null>(null)

  // Get or create service instance
  const getService = useCallback(() => {
    if (!serviceRef.current) {
      serviceRef.current = getE2EService(userId)
    }
    return serviceRef.current
  }, [userId])

  // Initialize E2E
  const initialize = useCallback(async (): Promise<string | null> => {
    if (isInitializing || isInitialized) return null

    setIsInitializing(true)
    setError(null)

    try {
      const service = getService()
      const publicKey = await service.initialize()

      // Get fingerprint for display
      const keyPair = await getIdentityKeys(userId)
      if (keyPair) {
        const fp = await generateKeyFingerprint(keyPair.publicKey)
        setFingerprint(fp)
      }

      // Register public key with server
      const response = await fetch("/api/e2e/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_key: publicKey,
          fingerprint: fingerprint || "pending",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to register public key with server")
      }

      setIsInitialized(true)
      return publicKey
    } catch (err) {
      const message = err instanceof Error ? err.message : "E2E initialization failed"
      setError(message)
      console.error("E2E initialization error:", err)
      return null
    } finally {
      setIsInitializing(false)
    }
  }, [userId, getService, isInitializing, isInitialized, fingerprint])

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize && userId) {
      const checkAndInit = async () => {
        const service = getService()
        const initialized = await service.isInitialized()
        if (initialized) {
          setIsInitialized(true)
          // Get fingerprint
          const keyPair = await getIdentityKeys(userId)
          if (keyPair) {
            const fp = await generateKeyFingerprint(keyPair.publicKey)
            setFingerprint(fp)
          }
        } else {
          initialize()
        }
      }
      checkAndInit()
    }
  }, [userId, autoInitialize, getService, initialize])

  // Encrypt a message
  const encryptMessage = useCallback(
    async (conversationId: string, plaintext: string): Promise<string> => {
      const service = getService()
      return service.encryptMessageForConversation(conversationId, plaintext)
    },
    [getService]
  )

  // Decrypt a message
  const decryptMessage = useCallback(
    async (conversationId: string, encrypted: string): Promise<string> => {
      const service = getService()
      return service.decryptMessageFromConversation(conversationId, encrypted)
    },
    [getService]
  )

  // Decrypt multiple messages
  const decryptMessages = useCallback(
    async (conversationId: string, messages: Array<{ id: string; content: string }>): Promise<Map<string, string>> => {
      const service = getService()
      return service.decryptMessages(conversationId, messages)
    },
    [getService]
  )

  // Establish key for conversation
  const establishKey = useCallback(
    async (conversationId: string, otherUserId: string, otherPublicKey: string): Promise<void> => {
      const service = getService()
      return service.establishConversationKey(conversationId, otherUserId, otherPublicKey)
    },
    [getService]
  )

  // Check if conversation has key
  const hasKeyForConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      const service = getService()
      return service.hasKeyForConversation(conversationId)
    },
    [getService]
  )

  return {
    isInitialized,
    isInitializing,
    error,
    fingerprint,
    initialize,
    encryptMessage,
    decryptMessage,
    decryptMessages,
    establishKey,
    hasKeyForConversation,
  }
}

// Hook to manage E2E for a specific conversation
interface UseConversationE2EOptions {
  userId: string
  conversationId: string
  otherUserId: string
}

interface UseConversationE2EReturn {
  isReady: boolean
  isEstablishing: boolean
  error: string | null
  encrypt: (plaintext: string) => Promise<string>
  decrypt: (encrypted: string) => Promise<string>
  decryptBatch: (messages: Array<{ id: string; content: string }>) => Promise<Map<string, string>>
}

export function useConversationE2E({
  userId,
  conversationId,
  otherUserId,
}: UseConversationE2EOptions): UseConversationE2EReturn {
  const [isReady, setIsReady] = useState(false)
  const [isEstablishing, setIsEstablishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const serviceRef = useRef<E2EService | null>(null)

  // Get or create service instance
  const getService = useCallback(() => {
    if (!serviceRef.current) {
      serviceRef.current = getE2EService(userId)
    }
    return serviceRef.current
  }, [userId])

  // Initialize and establish key
  useEffect(() => {
    const setup = async () => {
      if (!conversationId || !otherUserId) return

      setIsEstablishing(true)
      setError(null)

      try {
        const service = getService()

        // Check if we already have a key for this conversation
        const hasKey = await service.hasKeyForConversation(conversationId)
        if (hasKey) {
          setIsReady(true)
          setIsEstablishing(false)
          return
        }

        // Make sure we're initialized
        const initialized = await service.isInitialized()
        if (!initialized) {
          await service.initialize()
        }

        // Fetch other user's public key
        const response = await fetch(`/api/e2e/keys?user_id=${otherUserId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch other user's public key")
        }

        const { data } = await response.json()
        if (!data?.public_key) {
          // Other user hasn't set up E2E yet - use unencrypted messages
          console.warn("Other user has not set up E2E encryption")
          setError("Der andere Nutzer hat E2E noch nicht aktiviert")
          setIsEstablishing(false)
          return
        }

        // Establish conversation key
        await service.establishConversationKey(
          conversationId,
          otherUserId,
          data.public_key
        )

        setIsReady(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Key exchange failed"
        setError(message)
        console.error("Conversation E2E setup error:", err)
      } finally {
        setIsEstablishing(false)
      }
    }

    setup()
  }, [conversationId, otherUserId, getService])

  // Encrypt message
  const encrypt = useCallback(
    async (plaintext: string): Promise<string> => {
      if (!isReady) {
        // Fall back to unencrypted if not ready
        return plaintext
      }
      const service = getService()
      return service.encryptMessageForConversation(conversationId, plaintext)
    },
    [isReady, getService, conversationId]
  )

  // Decrypt message
  const decrypt = useCallback(
    async (encrypted: string): Promise<string> => {
      const service = getService()
      return service.decryptMessageFromConversation(conversationId, encrypted)
    },
    [getService, conversationId]
  )

  // Decrypt batch
  const decryptBatch = useCallback(
    async (messages: Array<{ id: string; content: string }>): Promise<Map<string, string>> => {
      const service = getService()
      return service.decryptMessages(conversationId, messages)
    },
    [getService, conversationId]
  )

  return {
    isReady,
    isEstablishing,
    error,
    encrypt,
    decrypt,
    decryptBatch,
  }
}
