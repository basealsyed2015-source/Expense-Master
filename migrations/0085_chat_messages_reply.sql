-- Add reply threading support to chat messages
ALTER TABLE chat_messages ADD COLUMN replied_to_message_id INTEGER;
