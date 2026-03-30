-- financing_requests.monthly_obligations: many databases already have this column
-- (manual ALTER, partial apply, or app-driven repair), so ADD COLUMN fails with
-- "duplicate column". D1 SQLite does not support ADD COLUMN IF NOT EXISTS.
-- This migration is a recorded no-op so later migrations can run.
--
-- If your database is missing monthly_obligations, run once before relying on the app:
--   npx wrangler d1 execute <DB_NAME> --remote --command="ALTER TABLE financing_requests ADD COLUMN monthly_obligations REAL DEFAULT 0;"
SELECT 1;
