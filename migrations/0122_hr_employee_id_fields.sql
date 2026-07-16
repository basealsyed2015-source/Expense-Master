-- Add id_type toggle (national / iqama) and national_id_expiry to hr_employees
ALTER TABLE hr_employees ADD COLUMN id_type TEXT DEFAULT 'national';
ALTER TABLE hr_employees ADD COLUMN national_id_expiry DATE;
