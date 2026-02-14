/**
 * E2E Encryption Module
 *
 * Provides end-to-end encryption for messages using:
 * - ECDH P-256 for key exchange
 * - AES-256-GCM for message encryption
 * - IndexedDB for secure key storage
 */

// Key Generation & Management
export {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  deriveSharedKey,
  generateConversationKey,
  exportAESKey,
  importAESKey,
  generateKeyFingerprint,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from "./key-generation"

// Message Encryption
export {
  encryptMessage,
  decryptMessage,
  serializeEncryptedMessage,
  deserializeEncryptedMessage,
  isEncryptedMessage,
  createDecryptionFailedPlaceholder,
  type EncryptedMessage,
} from "./message-crypto"

// Key Storage (IndexedDB)
export {
  storeIdentityKeys,
  getIdentityKeys,
  hasIdentityKeys,
  getPublicKeyBase64,
  storeConversationKey,
  getConversationKey,
  hasConversationKey,
  deleteConversationKey,
  getAllConversationKeys,
  deleteAllKeys,
  exportAllKeysAsBackup,
  importKeysFromBackup,
} from "./key-storage"

// Re-export the encryption service
export { E2EService } from "./e2e-service"
