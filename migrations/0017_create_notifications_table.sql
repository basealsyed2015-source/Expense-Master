-- Legacy notifications migration - NO-OP
-- Notifications table/indexes are already created in canonical schema.
-- Historical sample inserts here used hard-coded user IDs and caused
-- FK failures on fresh databases.
SELECT 1;
