-- customers.solutions_json: many databases already have this column
-- (manual ALTER, partial apply, or an earlier deploy), so ADD COLUMN fails with
-- "duplicate column". D1 SQLite does not support ADD COLUMN IF NOT EXISTS.
-- This migration is a recorded no-op so later migrations can run.
--
-- If your database is missing solutions_json, run once (local or remote) before relying on the app:
--   npx wrangler d1 execute tamweel-production-v2 --remote --command="ALTER TABLE customers ADD COLUMN solutions_json TEXT;"
SELECT 1;
