-- Hybrid tenant identifiers:
-- keep integer id for internal joins/FKs, add public_uuid for externally exposed references.

ALTER TABLE tenants ADD COLUMN public_uuid TEXT;

-- Backfill existing tenants that don't have a public UUID yet.
UPDATE tenants
SET public_uuid = lower(
  hex(randomblob(4)) || '-' ||
  hex(randomblob(2)) || '-' ||
  '4' || substr(hex(randomblob(2)), 2) || '-' ||
  substr('89ab', (abs(random()) % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' ||
  hex(randomblob(6))
)
WHERE public_uuid IS NULL OR trim(public_uuid) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_public_uuid ON tenants(public_uuid);
