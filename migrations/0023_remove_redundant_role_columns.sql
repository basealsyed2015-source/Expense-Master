-- Remove redundant role columns from users table
-- The 'role' and 'user_type' columns are redundant since we use role_id and role_name from the roles table

-- Drop the 'role' column (redundant text column that was always 'employee')
-- Note: SQLite DROP COLUMN requires SQLite 3.35.0+ (Cloudflare D1 supports this)
ALTER TABLE users DROP COLUMN role;

-- Drop the 'user_type' column (redundant grouping column)
-- This was causing inconsistency (role_id 2 and 3 both had user_type='company')
ALTER TABLE users DROP COLUMN user_type;
