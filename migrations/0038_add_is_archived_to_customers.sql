-- Migration: Add is_archived column to customers
-- Date: 2026-04-08
-- Description: Soft-archive customers so they disappear from the main list

ALTER TABLE customers ADD COLUMN is_archived INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE customers ADD COLUMN archived_at DATETIME;
ALTER TABLE customers ADD COLUMN archived_by INTEGER;

CREATE INDEX IF NOT EXISTS idx_customers_is_archived ON customers(is_archived);
