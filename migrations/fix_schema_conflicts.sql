-- Fix Schema Conflicts
-- Run this to fix financing_types column name mismatch

-- SQLite doesn't support ALTER COLUMN, so we recreate the table
-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS financing_types_backup AS SELECT * FROM financing_types;

-- Step 2: Drop and recreate with type_name (expected by 0001_full_system.sql)
DROP TABLE IF EXISTS financing_types;

CREATE TABLE financing_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_name TEXT UNIQUE NOT NULL,
  description TEXT,
  tenant_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Restore data (map 'name' to 'type_name')
-- The backup table has: id, name, description, tenant_id, created_at, updated_at
-- Target table needs: id, type_name, description, tenant_id, is_active, created_at
INSERT INTO financing_types (id, type_name, description, tenant_id, is_active, created_at)
SELECT 
  id,
  name as type_name,  -- Use 'name' column from backup as 'type_name'
  description,
  COALESCE(tenant_id, 1) as tenant_id,
  1 as is_active,  -- Default to active
  COALESCE(created_at, datetime('now')) as created_at
FROM financing_types_backup;

-- Cleanup
DROP TABLE IF EXISTS financing_types_backup;
