-- Per-template company stamp (first-party seal) for contract documents.
-- Upload via R2; URL stored on contract_templates.stamp_url.
ALTER TABLE contract_templates ADD COLUMN stamp_url TEXT;
