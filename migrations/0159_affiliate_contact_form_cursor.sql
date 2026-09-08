-- Per-link round-robin cursor for contact form submissions.
-- Separate from wa_last_auto_assigned_user_id (WhatsApp button picks) and
-- tenant_followup_auto_assign_state (CSV import / no-response transfers).
-- Each affiliate link now has its own independent cursor so assignments from
-- one link (e.g. Wasla) don't shift the rotation for another (e.g. Haloul Al Mawid).
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN cf_last_auto_assigned_user_id INTEGER;
