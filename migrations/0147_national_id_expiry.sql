-- Add national ID expiry date to customers, and the contract-side mirror column.
ALTER TABLE customers ADD COLUMN national_id_expiry TEXT;
ALTER TABLE contracts ADD COLUMN party_two_id_expiry TEXT;
