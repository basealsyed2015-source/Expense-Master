ALTER TABLE company_contact_followups ADD COLUMN is_no_response INTEGER DEFAULT 0;
ALTER TABLE company_contact_followups ADD COLUMN no_response_at TEXT;
ALTER TABLE company_contact_followups ADD COLUMN no_response_by INTEGER;
