-- ============================================
-- 0002_add_attachments.sql (LEGACY) - NO-OP
-- ============================================
-- These columns are already present in the
-- canonical schema defined in 01_create_all_tables.sql.
-- On a brand new database, running the original
-- ALTER TABLE statements causes duplicate-column
-- errors, so this migration is now intentionally
-- a NO-OP for new DBs.
--
-- Existing databases that already applied the
-- original version keep their columns; D1 will
-- not re-run this file on them.

-- NO-OP
SELECT 1;
