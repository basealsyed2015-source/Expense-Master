-- Broadcasts channel: only role_id=2 (admin) can post; all tenant users receive.
-- Strictly tenant-scoped — no cross-tenant visibility.

CREATE TABLE IF NOT EXISTS chat_broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_broadcasts_tenant ON chat_broadcasts(tenant_id, created_at DESC);

-- Per-user read cursor for the broadcasts channel (one row per user).
CREATE TABLE IF NOT EXISTS chat_broadcast_reads (
  user_id INTEGER NOT NULL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  last_read_broadcast_id INTEGER NOT NULL DEFAULT 0,
  last_read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
