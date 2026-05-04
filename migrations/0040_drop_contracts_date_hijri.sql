-- Contracts now keep one canonical stored date (Gregorian).
-- Hijri is derived in the UI from date_gregorian.
ALTER TABLE contracts DROP COLUMN date_hijri;
