-- Add id_type toggle (national / iqama), national_id_expiry, and id_document_url to hr_employees
ALTER TABLE hr_employees ADD COLUMN id_type TEXT DEFAULT 'national';
ALTER TABLE hr_employees ADD COLUMN national_id_expiry DATE;
ALTER TABLE hr_employees ADD COLUMN id_document_url TEXT;
