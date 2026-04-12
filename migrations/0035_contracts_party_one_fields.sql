-- Party one (company) fields on contracts: name, phone, optional logo (data URL or URL string)
ALTER TABLE contracts ADD COLUMN party_one_name TEXT;
ALTER TABLE contracts ADD COLUMN party_one_phone TEXT;
ALTER TABLE contracts ADD COLUMN party_one_logo TEXT;
