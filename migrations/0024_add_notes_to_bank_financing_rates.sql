-- Add optional notes field to bank_financing_rates for free-text user notes
ALTER TABLE bank_financing_rates ADD COLUMN notes TEXT;
