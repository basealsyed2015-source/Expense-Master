-- Separate toggle for device recognition checks at login.
-- login_ip_restriction_enabled controls IP allowlist checks (existing).
-- login_device_restriction_enabled controls device token / device OTP checks (new).
-- Both default to 0. Can be enabled independently.
ALTER TABLE tenants ADD COLUMN login_device_restriction_enabled INTEGER NOT NULL DEFAULT 0;
