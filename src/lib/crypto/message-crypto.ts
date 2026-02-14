/**
 * E2E Encryption: Message Encryption/Decryption
 *
 * Uses AES-256-GCM for symmetric encryption of messages.
 * Each message gets a unique IV (Initialization Vector).
 */

import { arrayBufferToBase64, base64ToArrayBuffer } from "./key-generation"

export interface EncryptedMessage {
  ciphertext: string // Base64 encoded encrypted content
  iv: string // Base64 encoded IV (12 bytes)
  version: number // Encryption version for future compatibility
}

// Current encryption version
const ENCRYPTION_VERSION = 1

// IV size for AES-GCM (12 bytes recommended)
const IV_SIZE = 12

/**
 * Encrypt a message using AES-GCM
 */
export async function encryptMessage(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedMessage> {
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE))

  // Encode message as UTF-8
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  )

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer),
    version: ENCRYPTION_VERSION,
  }
}

/**
 * Decrypt a message using AES-GCM
 */
export async function decryptMessage(
  encryptedMessage: EncryptedMessage,
  key: CryptoKey
): Promise<string> {
  // Check version compatibility
  if (encryptedMessage.version > ENCRYPTION_VERSION) {
    throw new Error(
      `Message encrypted with newer version (${encryptedMessage.version}). Please update the app.`
    )
  }

  const ciphertext = base64ToArrayBuffer(encryptedMessage.ciphertext)
  const iv = new Uint8Array(base64ToArrayBuffer(encryptedMessage.iv))

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
  )

  // Decode as UTF-8
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * Serialize encrypted message for storage
 */
export function serializeEncryptedMessage(encrypted: EncryptedMessage): string {
  return JSON.stringify(encrypted)
}

/**
 * Deserialize encrypted message from storage
 */
export function deserializeEncryptedMessage(serialized: string): EncryptedMessage {
  const parsed = JSON.parse(serialized)

  if (!parsed.ciphertext || !parsed.iv || typeof parsed.version !== "number") {
    throw new Error("Invalid encrypted message format")
  }

  return {
    ciphertext: parsed.ciphertext,
    iv: parsed.iv,
    version: parsed.version,
  }
}

/**
 * Check if a string is an encrypted message
 */
export function isEncryptedMessage(content: string): boolean {
  try {
    const parsed = JSON.parse(content)
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.ciphertext === "string" &&
      typeof parsed.iv === "string" &&
      typeof parsed.version === "number"
    )
  } catch {
    return false
  }
}

/**
 * Create a placeholder for failed decryption
 */
export function createDecryptionFailedPlaceholder(): string {
  return "[Nachricht konnte nicht entschlüsselt werden]"
}
