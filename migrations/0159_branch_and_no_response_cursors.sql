-- Per-branch lead assignment cursor.
-- All affiliate links and CSV imports scoped to the same branch share this cursor,
-- giving a single linear rotation across that branch regardless of which link the lead came from.
CREATE TABLE IF NOT EXISTS tenant_followup_branch_assign_state (
  tenant_id   INTEGER NOT NULL,
  branch_id   INTEGER NOT NULL,
  last_auto_assigned_user_id INTEGER,
  updated_at  TEXT,
  PRIMARY KEY (tenant_id, branch_id)
);

-- Separate no-response transfer cursor.
-- Keeps no-response redistribution linear without contaminating the new-lead assignment queues.
CREATE TABLE IF NOT EXISTS tenant_no_response_assign_state (
  tenant_id   INTEGER NOT NULL PRIMARY KEY,
  last_auto_assigned_user_id INTEGER,
  updated_at  TEXT
);
