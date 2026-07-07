-- Add is_forwarded flag to chat_messages
ALTER TABLE chat_messages ADD COLUMN is_forwarded INTEGER NOT NULL DEFAULT 0;
