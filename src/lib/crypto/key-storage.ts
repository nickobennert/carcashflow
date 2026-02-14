/**
 * E2E Encryption: Secure Key Storage
 *
 * Uses IndexedDB for secure client-side storage of cryptographic keys.
 * Keys are stored per-user and include:
 * - User's ECDH key pair (for key exchange)
 * - Conversation AES keys (derived from key exchange)
 */

import {
  exportPrivateKey,
  exportPublicKey,
  importPrivateKey,
  importPublicKey,
  exportAESKey,
  importAESKey,
} from "./key-generation"

const DB_NAME = "fahrmit_e2e_keys"
const DB_VERSION = 1

// Store names
const IDENTITY_STORE = "identity_keys"
const CONVERSATION_STORE = "conversation_keys"

interface IdentityKeyRecord {
  id: string // "identity_<userId>"
  userId: string
  publicKey: string // Base64 encoded
  privateKey: string // Base64 encoded
  createdAt: string
}

interface ConversationKeyRecord {
  id: string // conversationId
  userId: string // current user
  otherUserId: string // the other participant
  key: string // Base64 encoded AES key
  createdAt: string
  lastUsedAt: string
}

/**
 * Open IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error("Failed to open key storage database"))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Identity keys store
      if (!db.objectStoreNames.contains(IDENTITY_STORE)) {
        const identityStore = db.createObjectStore(IDENTITY_STORE, { keyPath: "id" })
        identityStore.createIndex("userId", "userId", { unique: true })
      }

      // Conversation keys store
      if (!db.objectStoreNames.contains(CONVERSATION_STORE)) {
        const convStore = db.createObjectStore(CONVERSATION_STORE, { keyPath: "id" })
        convStore.createIndex("userId", "userId", { unique: false })
      }
    }
  })
}

// ============================================
// Identity Keys (User's ECDH Key Pair)
// ============================================

/**
 * Store user's identity key pair
 */
export async function storeIdentityKeys(
  userId: string,
  keyPair: CryptoKeyPair
): Promise<void> {
  const db = await openDatabase()

  const record: IdentityKeyRecord = {
    id: `identity_${userId}`,
    userId,
    publicKey: await exportPublicKey(keyPair.publicKey),
    privateKey: await exportPrivateKey(keyPair.privateKey),
    createdAt: new Date().toISOString(),
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IDENTITY_STORE, "readwrite")
    const store = transaction.objectStore(IDENTITY_STORE)
    const request = store.put(record)

    request.onerror = () => reject(new Error("Failed to store identity keys"))
    request.onsuccess = () => {
      db.close()
      resolve()
    }
  })
}

/**
 * Get user's identity key pair
 */
export async function getIdentityKeys(
  userId: string
): Promise<CryptoKeyPair | null> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IDENTITY_STORE, "readonly")
    const store = transaction.objectStore(IDENTITY_STORE)
    const request = store.get(`identity_${userId}`)

    request.onerror = () => {
      db.close()
      reject(new Error("Failed to retrieve identity keys"))
    }

    request.onsuccess = async () => {
      db.close()

      if (!request.result) {
        resolve(null)
        return
      }

      const record = request.result as IdentityKeyRecord

      try {
        const publicKey = await importPublicKey(record.publicKey)
        const privateKey = await importPrivateKey(record.privateKey)
        resolve({ publicKey, privateKey })
      } catch (error) {
        console.error("Failed to import identity keys:", error)
        resolve(null)
      }
    }
  })
}

/**
 * Check if user has identity keys
 */
export async function hasIdentityKeys(userId: string): Promise<boolean> {
  const keys = await getIdentityKeys(userId)
  return keys !== null
}

/**
 * Get user's public key as base64 (for sending to server)
 */
export async function getPublicKeyBase64(userId: string): Promise<string | null> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IDENTITY_STORE, "readonly")
    const store = transaction.objectStore(IDENTITY_STORE)
    const request = store.get(`identity_${userId}`)

    request.onerror = () => {
      db.close()
      reject(new Error("Failed to retrieve public key"))
    }

    request.onsuccess = () => {
      db.close()
      if (!request.result) {
        resolve(null)
        return
      }
      resolve((request.result as IdentityKeyRecord).publicKey)
    }
  })
}

// ============================================
// Conversation Keys (AES Keys for Messages)
// ============================================

/**
 * Store conversation encryption key
 */
export async function storeConversationKey(
  conversationId: string,
  userId: string,
  otherUserId: string,
  key: CryptoKey
): Promise<void> {
  const db = await openDatabase()

  const record: ConversationKeyRecord = {
    id: conversationId,
    userId,
    otherUserId,
    key: await exportAESKey(key),
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONVERSATION_STORE, "readwrite")
    const store = transaction.objectStore(CONVERSATION_STORE)
    const request = store.put(record)

    request.onerror = () => reject(new Error("Failed to store conversation key"))
    request.onsuccess = () => {
      db.close()
      resolve()
    }
  })
}

/**
 * Get conversation encryption key
 */
export async function getConversationKey(
  conversationId: string
): Promise<CryptoKey | null> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONVERSATION_STORE, "readonly")
    const store = transaction.objectStore(CONVERSATION_STORE)
    const request = store.get(conversationId)

    request.onerror = () => {
      db.close()
      reject(new Error("Failed to retrieve conversation key"))
    }

    request.onsuccess = async () => {
      db.close()

      if (!request.result) {
        resolve(null)
        return
      }

      const record = request.result as ConversationKeyRecord

      try {
        const key = await importAESKey(record.key)
        resolve(key)
      } catch (error) {
        console.error("Failed to import conversation key:", error)
        resolve(null)
      }
    }
  })
}

/**
 * Check if conversation key exists
 */
export async function hasConversationKey(conversationId: string): Promise<boolean> {
  const key = await getConversationKey(conversationId)
  return key !== null
}

/**
 * Delete conversation key (when conversation is deleted)
 */
export async function deleteConversationKey(conversationId: string): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONVERSATION_STORE, "readwrite")
    const store = transaction.objectStore(CONVERSATION_STORE)
    const request = store.delete(conversationId)

    request.onerror = () => reject(new Error("Failed to delete conversation key"))
    request.onsuccess = () => {
      db.close()
      resolve()
    }
  })
}

/**
 * Get all conversation keys for a user
 */
export async function getAllConversationKeys(
  userId: string
): Promise<{ conversationId: string; otherUserId: string }[]> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONVERSATION_STORE, "readonly")
    const store = transaction.objectStore(CONVERSATION_STORE)
    const index = store.index("userId")
    const request = index.getAll(userId)

    request.onerror = () => {
      db.close()
      reject(new Error("Failed to retrieve conversation keys"))
    }

    request.onsuccess = () => {
      db.close()
      const records = request.result as ConversationKeyRecord[]
      resolve(
        records.map((r) => ({
          conversationId: r.id,
          otherUserId: r.otherUserId,
        }))
      )
    }
  })
}

// ============================================
// Key Management
// ============================================

/**
 * Delete all keys for a user (for account deletion or key rotation)
 */
export async function deleteAllKeys(userId: string): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [IDENTITY_STORE, CONVERSATION_STORE],
      "readwrite"
    )

    // Delete identity keys
    const identityStore = transaction.objectStore(IDENTITY_STORE)
    identityStore.delete(`identity_${userId}`)

    // Delete all conversation keys
    const convStore = transaction.objectStore(CONVERSATION_STORE)
    const index = convStore.index("userId")
    const cursorRequest = index.openCursor(userId)

    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        convStore.delete(cursor.primaryKey)
        cursor.continue()
      }
    }

    transaction.oncomplete = () => {
      db.close()
      resolve()
    }

    transaction.onerror = () => {
      db.close()
      reject(new Error("Failed to delete all keys"))
    }
  })
}

/**
 * Export all keys as JSON (for backup)
 */
export async function exportAllKeysAsBackup(userId: string): Promise<string> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const backup: {
      identity: IdentityKeyRecord | null
      conversations: ConversationKeyRecord[]
      exportedAt: string
    } = {
      identity: null,
      conversations: [],
      exportedAt: new Date().toISOString(),
    }

    const transaction = db.transaction(
      [IDENTITY_STORE, CONVERSATION_STORE],
      "readonly"
    )

    // Get identity keys
    const identityStore = transaction.objectStore(IDENTITY_STORE)
    const identityRequest = identityStore.get(`identity_${userId}`)
    identityRequest.onsuccess = () => {
      backup.identity = identityRequest.result || null
    }

    // Get all conversation keys
    const convStore = transaction.objectStore(CONVERSATION_STORE)
    const index = convStore.index("userId")
    const convRequest = index.getAll(userId)
    convRequest.onsuccess = () => {
      backup.conversations = convRequest.result || []
    }

    transaction.oncomplete = () => {
      db.close()
      // Note: This backup is sensitive! User should encrypt it before storing
      resolve(JSON.stringify(backup))
    }

    transaction.onerror = () => {
      db.close()
      reject(new Error("Failed to export keys"))
    }
  })
}

/**
 * Import keys from backup
 */
export async function importKeysFromBackup(
  userId: string,
  backupJson: string
): Promise<{ identityRestored: boolean; conversationsRestored: number }> {
  const db = await openDatabase()
  const backup = JSON.parse(backupJson)

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [IDENTITY_STORE, CONVERSATION_STORE],
      "readwrite"
    )

    let identityRestored = false
    let conversationsRestored = 0

    // Restore identity keys
    if (backup.identity) {
      const identityStore = transaction.objectStore(IDENTITY_STORE)
      identityStore.put({
        ...backup.identity,
        id: `identity_${userId}`,
        userId,
      })
      identityRestored = true
    }

    // Restore conversation keys
    if (backup.conversations && Array.isArray(backup.conversations)) {
      const convStore = transaction.objectStore(CONVERSATION_STORE)
      for (const conv of backup.conversations) {
        convStore.put({
          ...conv,
          userId,
        })
        conversationsRestored++
      }
    }

    transaction.oncomplete = () => {
      db.close()
      resolve({ identityRestored, conversationsRestored })
    }

    transaction.onerror = () => {
      db.close()
      reject(new Error("Failed to import keys"))
    }
  })
}
