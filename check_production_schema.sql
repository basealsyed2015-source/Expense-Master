-- Check Production Schema
-- Run this first to see what tables/columns exist in production:
-- npx wrangler d1 execute tamweel-production --remote --file check_production_schema.sql

-- List all tables
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- Check customers table structure
PRAGMA table_info(customers);

-- Check financing_types table structure  
PRAGMA table_info(financing_types);

-- Check financing_requests table structure
PRAGMA table_info(financing_requests);

-- Check roles table structure
PRAGMA table_info(roles);

-- Check if bank_financing_rates table exists
SELECT name FROM sqlite_master WHERE type='table' AND name='bank_financing_rates';
