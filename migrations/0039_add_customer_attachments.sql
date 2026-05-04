-- Add customer-level attachment URLs so customer edit and request edit share the same files.
ALTER TABLE customers ADD COLUMN id_attachment_url TEXT;
ALTER TABLE customers ADD COLUMN bank_statement_attachment_url TEXT;
ALTER TABLE customers ADD COLUMN salary_attachment_url TEXT;
ALTER TABLE customers ADD COLUMN additional_attachment_url TEXT;
