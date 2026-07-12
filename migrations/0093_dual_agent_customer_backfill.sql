-- Backfill dual-agent (role 6) customer scope for rows created before auto-assign fix.
-- Employee path: customer_assignments for customers created by role 6 without assignment.
INSERT OR IGNORE INTO customer_assignments (customer_id, employee_id, assigned_by, notes)
SELECT c.id, c.created_by, c.created_by, 'backfill dual agent employee scope'
FROM customers c
JOIN users u ON u.id = c.created_by AND u.role_id = 6
WHERE c.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM customer_assignments ca WHERE ca.customer_id = c.id
  );

-- Bank-agent path: self-assign on customer when creator is role 6 and column is empty.
UPDATE customers
SET assigned_bank_agent_id = created_by
WHERE created_by IN (SELECT id FROM users WHERE role_id = 6)
  AND (assigned_bank_agent_id IS NULL OR assigned_bank_agent_id = 0)
  AND created_by IS NOT NULL;
