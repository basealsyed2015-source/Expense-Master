-- D1 migrations split SQL on semicolons, which breaks CREATE TRIGGER bodies.
-- Triggers are applied after this migration via:
--   npx wrangler d1 execute tamweel-production-v2 --remote --file scripts/apply-bank-triggers.sql
SELECT 1;
