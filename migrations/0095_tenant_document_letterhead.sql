-- Letterhead header/footer images for contract documents (company-level).
-- Separate from the low-opacity center watermark; default opacity is fully opaque.
ALTER TABLE tenants ADD COLUMN document_header_url TEXT;
ALTER TABLE tenants ADD COLUMN document_header_enabled INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN document_header_opacity REAL DEFAULT 1;
ALTER TABLE tenants ADD COLUMN document_footer_url TEXT;
ALTER TABLE tenants ADD COLUMN document_footer_enabled INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN document_footer_opacity REAL DEFAULT 1;
