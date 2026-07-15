ALTER TABLE tenant_contact_affiliate_links ADD COLUMN assignment_mode TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN unassigned_limit_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN last_picked_roster_id INTEGER NULL;
