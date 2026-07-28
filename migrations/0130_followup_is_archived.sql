ALTER TABLE company_contact_followups ADD COLUMN is_archived INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_company_contact_followups_is_archived
  ON company_contact_followups (is_archived, tenant_id, created_at DESC);
