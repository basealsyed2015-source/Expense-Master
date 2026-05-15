-- Track who created a customer (used for role 5 visibility scope)
-- Safe to run on existing DBs: column is nullable for backwards compatibility.

ALTER TABLE customers ADD COLUMN created_by INTEGER REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers (created_by);

