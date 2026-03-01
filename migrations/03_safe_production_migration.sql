-- Safe Production Migration (LEGACY) - NO-OP
-- -----------------------------------------
-- This script was designed to gently repair
-- older production schemas by adding missing
-- tables/columns. On a brand new database,
-- the canonical migrations already include
-- these structures, so running the original
-- ALTER TABLE statements causes duplicate-
-- column errors (e.g. full_name on customers).
--
-- For new databases, this migration is now a
-- NO-OP. Existing databases that previously
-- applied it are unaffected, since D1 will
-- not re-run it.

-- NO-OP
SELECT 1;
