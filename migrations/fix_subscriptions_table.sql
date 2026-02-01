-- Fix subscriptions table structure
-- The existing table has: id, company_name, status, plan_type, created_at
-- The expected structure needs: id, company_name, package_id, start_date, end_date, status, calculations_used, created_at

-- Backup existing data
CREATE TABLE IF NOT EXISTS subscriptions_backup AS SELECT * FROM subscriptions;

-- Drop and recreate with correct structure
DROP TABLE IF EXISTS subscriptions;

CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    package_id INTEGER,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active',
    calculations_used INTEGER DEFAULT 0,
    plan_type TEXT,  -- Keep for backward compatibility
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tenant_id INTEGER,
    FOREIGN KEY (package_id) REFERENCES packages(id)
);

-- Restore data (map old structure to new)
INSERT INTO subscriptions (id, company_name, status, plan_type, created_at, tenant_id)
SELECT 
    id,
    company_name,
    COALESCE(status, 'active') as status,
    plan_type,
    COALESCE(created_at, datetime('now')) as created_at,
    COALESCE(tenant_id, 1) as tenant_id
FROM subscriptions_backup;

-- Cleanup
DROP TABLE IF EXISTS subscriptions_backup;
