# E2E-Verschlüsselung Setup-Anleitung

## 1. SQL Migration für Supabase

Führe die folgenden SQL-Befehle in der Supabase SQL-Konsole aus:

### Schritt 1: Neue Tabellen erstellen

```sql
-- ============================================
-- E2E Encryption Tables
-- ============================================

-- 1. User Public Keys (für Key Exchange)
CREATE TABLE user_public_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL, -- Base64 encoded ECDH public key
  fingerprint TEXT NOT NULL, -- SHA-256 fingerprint for verification
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index für schnellen Lookup
CREATE INDEX idx_user_public_keys_user_id ON user_public_keys(user_id);

-- 2. Conversation Keys (verschlüsselte Conversation-Keys pro User)
CREATE TABLE conversation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL, -- AES key verschlüsselt mit User's public key
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(conversation_id, user_id)
);

-- Index für schnellen Lookup
CREATE INDEX idx_conversation_keys_conv_id ON conversation_keys(conversation_id);
CREATE INDEX idx_conversation_keys_user_id ON conversation_keys(user_id);
```

### Schritt 2: Messages-Tabelle erweitern

```sql
-- 3. is_encrypted Spalte zu messages hinzufügen
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- Index für verschlüsselte Nachrichten
CREATE INDEX idx_messages_encrypted ON messages(is_encrypted) WHERE is_encrypted = true;
```

### Schritt 3: RLS (Row Level Security) Policies

```sql
-- ============================================
-- RLS Policies für E2E Tables
-- ============================================

-- Enable RLS
ALTER TABLE user_public_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_keys ENABLE ROW LEVEL SECURITY;

-- User Public Keys: Jeder kann lesen, nur eigene schreiben
CREATE POLICY "Users can view any public key"
  ON user_public_keys FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own public key"
  ON user_public_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own public key"
  ON user_public_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own public key"
  ON user_public_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Conversation Keys: Nur eigene Keys lesen/schreiben
CREATE POLICY "Users can view own conversation keys"
  ON conversation_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation keys"
  ON conversation_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation keys"
  ON conversation_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversation keys"
  ON conversation_keys FOR DELETE
  USING (auth.uid() = user_id);
```

### Schritt 4: Service Role Zugriff (für Server-seitige Operationen)

Die API-Routes nutzen den Admin Client (Service Role), daher ist zusätzlicher Zugriff nicht nötig.

---

## 2. Wie die E2E-Verschlüsselung funktioniert

### Architektur

```
User A                    Server                    User B
  |                         |                         |
  |-- Generate Key Pair --->|                         |
  |-- Store Public Key ---->|                         |
  |                         |<--- Generate Key Pair --|
  |                         |<--- Store Public Key ---|
  |                         |                         |
  |<--- Fetch B's Key ------|                         |
  |-- Derive Shared Key --->|                         |
  |                         |<--- Fetch A's Key ------|
  |                         |<--- Derive Shared Key --|
  |                         |                         |
  |-- Encrypt Message ----->|-- Store Encrypted ----->|
  |                         |                         |
  |                         |<--- Decrypt Message ----|
```

### Verschlüsselungsdetails

- **Key Exchange**: ECDH P-256 (Elliptic Curve Diffie-Hellman)
- **Message Encryption**: AES-256-GCM
- **Key Storage**: IndexedDB im Browser (nie auf Server)
- **Public Keys**: Auf Server gespeichert (für Key Exchange)
- **Private Keys**: Nur lokal im Browser

### Datenfluss

1. **Initialisierung**: User öffnet Chat → System generiert ECDH Key Pair
2. **Key Exchange**: System tauscht Public Keys aus
3. **Shared Secret**: ECDH deriviert gemeinsamen Schlüssel
4. **Verschlüsselung**: Jede Nachricht wird mit AES-GCM verschlüsselt
5. **Speicherung**: Nur verschlüsselter Text wird auf Server gespeichert

---

## 3. E2E-Verschlüsselung testen

### Test 1: Key Generation

Öffne die Browser-Konsole und führe aus:

```javascript
// Prüfe ob IndexedDB funktioniert
const openRequest = indexedDB.open("fahrmit_e2e_keys", 1);
openRequest.onsuccess = () => {
  console.log("IndexedDB OK:", openRequest.result);
  openRequest.result.close();
};
```

### Test 2: Verschlüsselung prüfen

1. Öffne zwei Browser (oder ein normales + ein Inkognito-Fenster)
2. Logge dich mit zwei verschiedenen Accounts ein
3. Starte eine Konversation zwischen den beiden
4. Sende eine Nachricht

**Im Netzwerk-Tab prüfen:**
- Die gesendete Nachricht sollte als JSON verschlüsselt sein:
  ```json
  {"ciphertext":"...base64...","iv":"...base64...","version":1}
  ```

**In Supabase prüfen:**
```sql
SELECT id, sender_id, content, is_encrypted
FROM messages
WHERE is_encrypted = true
ORDER BY created_at DESC
LIMIT 5;
```

Die `content`-Spalte sollte verschlüsselten JSON-Text enthalten, NICHT die Originalnachricht.

### Test 3: Entschlüsselung prüfen

1. Lade die Seite neu
2. Öffne die Konversation
3. Die Nachrichten sollten im Klartext angezeigt werden
4. In der Browser-Konsole sollte keine Fehlermeldung erscheinen

### Test 4: Cross-Device (fortgeschritten)

1. Exportiere Keys auf Gerät A:
   ```javascript
   // In Browser-Konsole auf Gerät A
   const { exportAllKeysAsBackup } = await import("/lib/crypto/key-storage.js");
   const backup = await exportAllKeysAsBackup("DEINE_USER_ID");
   console.log(backup); // Kopiere diesen Text
   ```

2. Importiere auf Gerät B:
   ```javascript
   // In Browser-Konsole auf Gerät B
   const { importKeysFromBackup } = await import("/lib/crypto/key-storage.js");
   await importKeysFromBackup("DEINE_USER_ID", 'BACKUP_JSON_HIER');
   ```

3. Nachrichten sollten jetzt auf beiden Geräten lesbar sein

---

## 4. Troubleshooting

### Problem: "Verschlüsselung nicht verfügbar"

**Ursache**: Der andere User hat noch keine E2E-Keys generiert.

**Lösung**: Der andere User muss einmal die Messages-Seite öffnen, damit Keys generiert werden.

### Problem: "[Nachricht konnte nicht entschlüsselt werden]"

**Ursache**:
- Browser-Cache gelöscht (Keys verloren)
- Anderes Gerät ohne Key-Backup

**Lösung**: Keys müssen exportiert/importiert werden (siehe Test 4).

### Problem: Alte Nachrichten nicht lesbar

**Ursache**: Nachrichten vor E2E-Aktivierung sind unverschlüsselt.

**Lösung**: Das ist normal. Nur neue Nachrichten werden verschlüsselt.

---

## 5. Wichtige Hinweise

### Für Entwickler

1. **Private Keys niemals loggen oder auf Server senden**
2. **IndexedDB-Daten sind gerätespezifisch**
3. **Bei Key-Rotation müssen alle Conversation-Keys neu erstellt werden**

### Für User

1. **Browser-Daten löschen = Keys verloren**
2. **Backup-Funktion nutzen für mehrere Geräte**
3. **Verschlüsselte Nachrichten können vom Server NICHT gelesen werden**

---

## 6. Zukünftige Erweiterungen

- [ ] Key Backup mit Passwort-Verschlüsselung
- [ ] QR-Code für Key-Austausch
- [ ] Fingerprint-Verifikation UI
- [ ] Automatische Key-Rotation
- [ ] Forward Secrecy (Double Ratchet)
