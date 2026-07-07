-- Company internal chat: tenant-scoped 1:1 conversations with persisted history.
-- Live delivery is handled by a Durable Object; D1 is the durable source of truth.

CREATE TABLE IF NOT EXISTS chat_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  participant_one_id INTEGER NOT NULL,
  participant_two_id INTEGER NOT NULL,
  last_message_id INTEGER,
  last_message_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, participant_one_id, participant_two_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_tenant ON chat_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_p1 ON chat_conversations(tenant_id, participant_one_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_p2 ON chat_conversations(tenant_id, participant_two_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  body TEXT,
  attachment_json TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant ON chat_messages(tenant_id);

CREATE TABLE IF NOT EXISTS chat_message_reads (
  conversation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  last_read_message_id INTEGER NOT NULL DEFAULT 0,
  last_read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_message_reads_user ON chat_message_reads(user_id);
