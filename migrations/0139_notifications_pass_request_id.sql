-- Add related_pass_request_id to notifications for task-pass notification linking
ALTER TABLE notifications ADD COLUMN related_pass_request_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_notifications_pass_request ON notifications(related_pass_request_id);
