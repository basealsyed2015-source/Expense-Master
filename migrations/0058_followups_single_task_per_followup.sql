-- Enforce a single follow-up task per follow-up.
-- Keep the newest task (highest id) when duplicates exist.

DELETE FROM company_contact_followup_tasks
WHERE id NOT IN (
  SELECT MAX(id) FROM company_contact_followup_tasks GROUP BY followup_id
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_followup_tasks_one_per_followup
  ON company_contact_followup_tasks (followup_id);
