/**
 * E2E Encryption: Key Generation
 *
 * Uses Web Crypto API for secure key generation.
 * - ECDH P-256 for key exchange
 * - AES-GCM for message encryption
 */

// Generate ECDH key pair for key exchange
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    ["deriveKey", "deriveBits"]
  )
}

// Export public key to base64 for storage/transmission
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", publicKey)
  return arrayBufferToBase64(exported)
}

// Export private key to base64 for storage
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("pkcs8", privateKey)
  return arrayBufferToBase64(exported)
}

// Import public key from base64
export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(base64Key)
  return crypto.subtle.importKey(
    "spki",
    keyData,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  )
}

// Import private key from base64
export async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(base64Key)
  return crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  )
}

// Derive shared secret using ECDH
export async function deriveSharedKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable for backup purposes
    ["encrypt", "decrypt"]
  )
}

// Export AES key to base64 for storage
export async function exportAESKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key)
  return arrayBufferToBase64(exported)
}

// Import AES key from base64
export async function importAESKey(base64Key: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(base64Key)
  return crypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  )
}

// Generate a random AES key for conversation encryption
export async function generateConversationKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  )
}

// Helper: ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Helper: Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Generate a secure fingerprint of a public key (for verification)
export async function generateKeyFingerprint(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", publicKey)
  const hashBuffer = await crypto.subtle.digest("SHA-256", exported)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  // Convert to hex and format as groups of 4 characters
  const hex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
  return hex.match(/.{1,4}/g)?.join(" ").toUpperCase() || hex.toUpperCase()
}
