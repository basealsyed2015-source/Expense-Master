-- Expand the financing/customer attachment model from 4 docs to 8 docs.
-- New required UI types:
-- 1) identity, 2) signature, 3) salary_profile, 4) gosi, 5) tax_exemption,
-- 6) additional_1, 7) additional_2, 8) additional_3

ALTER TABLE financing_requests ADD COLUMN identity_attachment_url TEXT;
ALTER TABLE financing_requests ADD COLUMN signature_attachment_url TEXT;
ALTER TABLE financing_requests ADD COLUMN salary_profile_attachment_url TEXT;
ALTER TABLE financing_requests ADD COLUMN gosi_attachment_url TEXT;
ALTER TABLE financing_requests ADD COLUMN tax_exemption_attachment_url TEXT;
ALTER TABLE financing_requests ADD COLUMN additional_1_attachment_url TEXT;
ALTER TABLE financing_requests ADD COLUMN additional_2_attachment_url TEXT;
ALTER TABLE financing_requests ADD COLUMN additional_3_attachment_url TEXT;

ALTER TABLE customers ADD COLUMN identity_attachment_url TEXT;
ALTER TABLE customers ADD COLUMN signature_attachment_url TEXT;
ALTER TABLE customers ADD COLUMN salary_profile_attachment_url TEXT;
ALTER TABLE customers ADD COLUMN gosi_attachment_url TEXT;
ALTER TABLE customers ADD COLUMN tax_exemption_attachment_url TEXT;
ALTER TABLE customers ADD COLUMN additional_1_attachment_url TEXT;
ALTER TABLE customers ADD COLUMN additional_2_attachment_url TEXT;
ALTER TABLE customers ADD COLUMN additional_3_attachment_url TEXT;

