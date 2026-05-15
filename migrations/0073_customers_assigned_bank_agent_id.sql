-- Direct bank agent assignment on customer (without requiring a financing request)
ALTER TABLE customers ADD COLUMN assigned_bank_agent_id INTEGER REFERENCES users(id);
