-- Login security feature: IP restriction, device recognition, OTP, geo logging.
-- All checks are opt-in per tenant via login_ip_restriction_enabled (default 0).
-- Role 1 (superadmin) bypasses all checks regardless of flag.

ALTER TABLE tenants ADD COLUMN login_ip_restriction_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tenants ADD COLUMN home_city TEXT;

-- Tenant-level office IP allowlist managed by company admin.
-- Supports exact IPs and IPv4 CIDR ranges. No expiry — office IPs are stable.
CREATE TABLE IF NOT EXISTS tenant_login_allowed_ips (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id  INTEGER NOT NULL,
  ip         TEXT NOT NULL,
  label      TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_login_ips_unique
  ON tenant_login_allowed_ips (tenant_id, ip);

-- Per-user OTP-verified IP. One row per user; replaced on each new OTP success.
-- Set by both device OTP (auto-whitelist) and IP OTP (explicit). 7-day expiry.
CREATE TABLE IF NOT EXISTS user_login_allowed_ips (
  user_id    INTEGER PRIMARY KEY,
  ip         TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Trusted devices per user. Set via deviceToken cookie (365 days). No expiry —
-- revoked by deleting the row. Multiple devices per user are allowed.
CREATE TABLE IF NOT EXISTS user_login_devices (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_login_devices_user
  ON user_login_devices (user_id);

-- Short-lived OTP codes. 10-minute expiry, one-time use.
-- otp_type: 'device' (sent to company contact_email) | 'ip' (sent to user email).
-- ip column stores the IP the OTP was issued for, used to whitelist on success.
CREATE TABLE IF NOT EXISTS tenant_login_otps (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  code       TEXT NOT NULL,
  ip         TEXT NOT NULL,
  otp_type   TEXT NOT NULL CHECK (otp_type IN ('device', 'ip')),
  expires_at DATETIME NOT NULL,
  is_used    INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit log for logins originating outside the tenant's home city (cf.city).
-- Written regardless of outcome. otp_verified updated to 1 on successful OTP.
CREATE TABLE IF NOT EXISTS tenant_login_geo_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  tenant_id    INTEGER NOT NULL,
  ip           TEXT NOT NULL,
  country      TEXT,
  city         TEXT,
  otp_verified INTEGER NOT NULL DEFAULT 0,
  logged_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
