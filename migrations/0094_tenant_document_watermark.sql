-- Background watermark for printed/previewed contract documents (company-level).
-- Low-opacity image behind text; distinct from the draft "مسودة غير معتمدة" overlay.
ALTER TABLE tenants ADD COLUMN document_watermark_url TEXT;
ALTER TABLE tenants ADD COLUMN document_watermark_enabled INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN document_watermark_opacity REAL DEFAULT 0.12;
