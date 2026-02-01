-- Safe Production Migration
-- IMPORTANT: Run check_production_schema.sql FIRST to see what exists
-- Then run this: npx wrangler d1 execute tamweel-production --remote --file migrations/03_safe_production_migration.sql

-- This script uses CREATE TABLE IF NOT EXISTS to safely create missing tables
-- For columns, we'll add them with ALTER TABLE (will fail if exists, but that's okay - just means it's already there)

-- ========================================
-- CREATE MISSING TABLES (if they don't exist)
-- ========================================

-- Create tenants table if not exists
CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#667eea',
  secondary_color TEXT DEFAULT '#764ba2',
  subscription_id INTEGER,
  status TEXT DEFAULT 'active',
  max_users INTEGER DEFAULT 5,
  max_customers INTEGER DEFAULT 100,
  max_requests INTEGER DEFAULT 1000,
  features_json TEXT,
  settings_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  trial_ends_at DATETIME,
  subscription_ends_at DATETIME,
  contact_email TEXT,
  contact_phone TEXT,
  total_customers INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0
);

-- Create roles table if not exists (with role_name_ar)
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name TEXT NOT NULL UNIQUE,
  role_name_ar TEXT,
  description TEXT,
  is_system_role INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table if not exists
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  permission_key TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  permission_name_ar TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions table if not exists
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- Create bank_financing_rates table if not exists
CREATE TABLE IF NOT EXISTS bank_financing_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_id INTEGER NOT NULL,
  financing_type_id INTEGER NOT NULL,
  rate REAL NOT NULL,
  min_amount REAL,
  max_amount REAL,
  min_duration INTEGER,
  max_duration INTEGER,
  is_active INTEGER DEFAULT 1,
  tenant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
  FOREIGN KEY (financing_type_id) REFERENCES financing_types(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
);

-- ========================================
-- ADD MISSING COLUMNS (if they don't exist)
-- ========================================
-- Note: These will fail if columns already exist, but that's okay
-- The error will be ignored and we'll continue

-- Add full_name to customers (if it doesn't exist)
-- If this fails, the column already exists - that's fine
ALTER TABLE customers ADD COLUMN full_name TEXT;

-- Add type_name to financing_types (if it doesn't exist)  
-- If this fails, the column already exists - that's fine
ALTER TABLE financing_types ADD COLUMN type_name TEXT;

-- Add selected_bank_id to financing_requests (if it doesn't exist)
ALTER TABLE financing_requests ADD COLUMN selected_bank_id INTEGER;

-- Add role_name_ar to roles (if it doesn't exist)
ALTER TABLE roles ADD COLUMN role_name_ar TEXT;

-- Add is_system_role to roles (if it doesn't exist)
ALTER TABLE roles ADD COLUMN is_system_role INTEGER DEFAULT 0;

-- ========================================
-- UPDATE DATA (if needed)
-- ========================================

-- Copy name to full_name in customers (if full_name is null and name exists)
UPDATE customers SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;

-- Copy name to type_name in financing_types (if type_name is null and name exists)
UPDATE financing_types SET type_name = name WHERE type_name IS NULL AND name IS NOT NULL;
