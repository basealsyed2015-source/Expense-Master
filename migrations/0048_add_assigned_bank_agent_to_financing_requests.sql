-- Optional link from a funding request to the bank agent (user role 5) for that company + bank.
ALTER TABLE financing_requests ADD COLUMN assigned_bank_agent_id INTEGER REFERENCES users(id);
