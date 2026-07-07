-- Customer tags on chat messages: each row links one message to one tagged
-- customer. display_name is the name snapshot at send time so message history
-- renders stably even if the customer is renamed later. Access control on the
-- link target is enforced when the user opens /admin/customers/:id, not here.

CREATE TABLE IF NOT EXISTS chat_message_customer_tags (
  message_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_tags_message ON chat_message_customer_tags(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_tags_customer ON chat_message_customer_tags(customer_id);
