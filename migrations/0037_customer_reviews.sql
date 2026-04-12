-- Migration: Create customer_reviews table
-- Date: 2026-04-08
-- Description: Star ratings (1-5) and feedback notes for customers

CREATE TABLE IF NOT EXISTS customer_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  note TEXT,
  user_id INTEGER,
  tenant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_customer_id ON customer_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_tenant_id ON customer_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_rating ON customer_reviews(rating);
