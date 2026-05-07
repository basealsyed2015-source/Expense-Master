-- Note required when creating a pass request
ALTER TABLE company_contact_followup_task_pass_requests ADD COLUMN note_text TEXT;

CREATE INDEX IF NOT EXISTS idx_followup_task_pass_to_pending_created
  ON company_contact_followup_task_pass_requests (to_user_id, tenant_id, status, created_at DESC);
