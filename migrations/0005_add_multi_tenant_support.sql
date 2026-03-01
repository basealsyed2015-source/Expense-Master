-- Migration 0005: Add Multi-Tenant Support (LEGACY) - NO-OP
-- --------------------------------------------------------
-- Multi-tenant schema (tenants + tenant_id columns) is
-- already baked into the canonical schema in
-- 01_create_all_tables.sql and later migrations.
-- Running the original ALTER TABLE statements on a new
-- database causes duplicate-column errors, so this
-- migration is now intentionally a NO-OP for new DBs.
--
-- Existing databases that previously applied the
-- original version are unaffected because D1 will
-- not re-run this file for them.

-- NO-OP
SELECT 1;
