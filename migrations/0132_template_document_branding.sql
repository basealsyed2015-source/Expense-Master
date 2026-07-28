-- Per-template document branding: watermark, letterhead header, and footer.
-- Migrated from tenant-level settings so each template can have its own branding.
ALTER TABLE contract_templates ADD COLUMN document_watermark_url TEXT;
ALTER TABLE contract_templates ADD COLUMN document_watermark_enabled INTEGER DEFAULT 0;
ALTER TABLE contract_templates ADD COLUMN document_watermark_opacity REAL DEFAULT 0.12;
ALTER TABLE contract_templates ADD COLUMN document_header_url TEXT;
ALTER TABLE contract_templates ADD COLUMN document_header_enabled INTEGER DEFAULT 0;
ALTER TABLE contract_templates ADD COLUMN document_header_opacity REAL DEFAULT 1;
ALTER TABLE contract_templates ADD COLUMN document_footer_url TEXT;
ALTER TABLE contract_templates ADD COLUMN document_footer_enabled INTEGER DEFAULT 0;
ALTER TABLE contract_templates ADD COLUMN document_footer_opacity REAL DEFAULT 1;
