-- Add customer_limit column to users table for controlling auto-assignment capacity per employee
ALTER TABLE users ADD COLUMN customer_limit INTEGER DEFAULT NULL;
