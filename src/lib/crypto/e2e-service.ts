/**
 * E2E Encryption Service
 *
 * High-level service that handles the complete E2E encryption workflow:
 * - Key generation and storage
 * - Key exchange with other users
 * - Message encryption/decryption
 */

import {
  generateKeyPair,
  deriveSharedKey,
  importPublicKey,
  generateKeyFingerprint,
} from "./key-generation"
import {
  encryptMessage,
  decryptMessage,
  serializeEncryptedMessage,
  deserializeEncryptedMessage,
  isEncryptedMessage,
  createDecryptionFailedPlaceholder,
  type EncryptedMessage,
} from "./message-crypto"
import {
  storeIdentityKeys,
  getIdentityKeys,
  hasIdentityKeys,
  getPublicKeyBase64,
  storeConversationKey,
  getConversationKey,
  hasConversationKey,
} from "./key-storage"

export class E2EService {
  private userId: string
  private initialized: boolean = false

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Initialize E2E for user - creates identity keys if needed
   * Returns the user's public key (base64) to be stored on server
   */
  async initialize(): Promise<string> {
    // Check if keys already exist
    const hasKeys = await hasIdentityKeys(this.userId)

    if (!hasKeys) {
      // Generate new key pair
      const keyPair = await generateKeyPair()
      await storeIdentityKeys(this.userId, keyPair)
    }

    this.initialized = true

    // Return public key for server storage
    const publicKey = await getPublicKeyBase64(this.userId)
    if (!publicKey) {
      throw new Error("Failed to get public key after initialization")
    }

    return publicKey
  }

  /**
   * Check if E2E is initialized for this user
   */
  async isInitialized(): Promise<boolean> {
    return hasIdentityKeys(this.userId)
  }

  /**
   * Get the user's public key fingerprint (for verification)
   */
  async getFingerprint(): Promise<string> {
    const keyPair = await getIdentityKeys(this.userId)
    if (!keyPair) {
      throw new Error("Identity keys not found")
    }
    return generateKeyFingerprint(keyPair.publicKey)
  }

  /**
   * Establish encrypted channel with another user
   * This derives a shared key from ECDH key exchange
   */
  async establishConversationKey(
    conversationId: string,
    otherUserId: string,
    otherUserPublicKeyBase64: string
  ): Promise<void> {
    // Check if we already have a key for this conversation
    if (await hasConversationKey(conversationId)) {
      return
    }

    // Get our private key
    const keyPair = await getIdentityKeys(this.userId)
    if (!keyPair) {
      throw new Error("Identity keys not found. Call initialize() first.")
    }

    // Import the other user's public key
    const otherPublicKey = await importPublicKey(otherUserPublicKeyBase64)

    // Derive shared secret using ECDH
    const sharedKey = await deriveSharedKey(keyPair.privateKey, otherPublicKey)

    // Store the conversation key
    await storeConversationKey(
      conversationId,
      this.userId,
      otherUserId,
      sharedKey
    )
  }

  /**
   * Encrypt a message for a conversation
   */
  async encryptMessageForConversation(
    conversationId: string,
    plaintext: string
  ): Promise<string> {
    const key = await getConversationKey(conversationId)
    if (!key) {
      throw new Error(
        `No encryption key found for conversation ${conversationId}. ` +
        "Key exchange may not be complete."
      )
    }

    const encrypted = await encryptMessage(plaintext, key)
    return serializeEncryptedMessage(encrypted)
  }

  /**
   * Decrypt a message from a conversation
   */
  async decryptMessageFromConversation(
    conversationId: string,
    encryptedContent: string
  ): Promise<string> {
    // Check if the content is encrypted
    if (!isEncryptedMessage(encryptedContent)) {
      // Return as-is for legacy unencrypted messages
      return encryptedContent
    }

    const key = await getConversationKey(conversationId)
    if (!key) {
      console.error(`No decryption key for conversation ${conversationId}`)
      return createDecryptionFailedPlaceholder()
    }

    try {
      const encryptedMessage = deserializeEncryptedMessage(encryptedContent)
      return await decryptMessage(encryptedMessage, key)
    } catch (error) {
      console.error("Failed to decrypt message:", error)
      return createDecryptionFailedPlaceholder()
    }
  }

  /**
   * Decrypt multiple messages in batch
   */
  async decryptMessages(
    conversationId: string,
    messages: Array<{ id: string; content: string }>
  ): Promise<Map<string, string>> {
    const decrypted = new Map<string, string>()

    const key = await getConversationKey(conversationId)

    for (const msg of messages) {
      if (!isEncryptedMessage(msg.content)) {
        // Not encrypted - use as-is
        decrypted.set(msg.id, msg.content)
        continue
      }

      if (!key) {
        decrypted.set(msg.id, createDecryptionFailedPlaceholder())
        continue
      }

      try {
        const encryptedMessage = deserializeEncryptedMessage(msg.content)
        const plaintext = await decryptMessage(encryptedMessage, key)
        decrypted.set(msg.id, plaintext)
      } catch {
        decrypted.set(msg.id, createDecryptionFailedPlaceholder())
      }
    }

    return decrypted
  }

  /**
   * Check if a conversation has encryption keys
   */
  async hasKeyForConversation(conversationId: string): Promise<boolean> {
    return hasConversationKey(conversationId)
  }

  /**
   * Get the public key to be stored on server (for key exchange with others)
   */
  async getPublicKey(): Promise<string | null> {
    return getPublicKeyBase64(this.userId)
  }
}

// Singleton instance cache
const serviceInstances = new Map<string, E2EService>()

/**
 * Get or create E2E service instance for a user
 */
export function getE2EService(userId: string): E2EService {
  if (!serviceInstances.has(userId)) {
    serviceInstances.set(userId, new E2EService(userId))
  }
  return serviceInstances.get(userId)!
}

/**
 * Clear all service instances (for logout)
 */
export function clearE2EServices(): void {
  serviceInstances.clear()
}
