-- Employee self-service insurance documents on My Profile
ALTER TABLE hr_employees ADD COLUMN medical_insurance_document_url TEXT;
ALTER TABLE hr_employees ADD COLUMN medical_insurance_expiry DATE;
ALTER TABLE hr_employees ADD COLUMN gosi_document_url TEXT;
ALTER TABLE hr_employees ADD COLUMN gosi_document_expiry DATE;
