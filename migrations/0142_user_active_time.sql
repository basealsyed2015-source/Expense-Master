-- Staff active time tracking (roles 4/5/6). See docs/plan_staff_active_time.md.

CREATE TABLE IF NOT EXISTS user_active_time_daily (
  user_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  activity_date TEXT NOT NULL,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_user_active_time_daily_tenant_date
  ON user_active_time_daily (tenant_id, activity_date);

-- Server-side last heartbeat marker per user. Used to compute a trusted delta
-- (never credit more than ~90s per ping regardless of what the client sends).
CREATE TABLE IF NOT EXISTS user_active_time_state (
  user_id INTEGER PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  last_heartbeat_at TEXT NOT NULL
);
