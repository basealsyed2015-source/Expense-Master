-- Legacy cleanup was originally: DROP COLUMN role, DROP COLUMN user_type on users.
-- Databases created from migrations/01_create_all_tables.sql never had those columns
-- (only role_id), so ALTER TABLE ... DROP COLUMN role fails with "no such column".
--
-- This file is a no-op so migration order stays stable. If you have an old database
-- that still includes users.role or users.user_type, remove them manually (SQLite 3.35+ / D1), e.g.:
--   ALTER TABLE users DROP COLUMN role;
--   ALTER TABLE users DROP COLUMN user_type;

SELECT 1;
