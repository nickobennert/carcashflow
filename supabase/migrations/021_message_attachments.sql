-- =====================================================
-- MESSAGE ATTACHMENTS - Bilder/Dateien in Nachrichten
-- =====================================================

-- Add attachment fields to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,  -- 'image', 'file'
ADD COLUMN IF NOT EXISTS attachment_name TEXT;
