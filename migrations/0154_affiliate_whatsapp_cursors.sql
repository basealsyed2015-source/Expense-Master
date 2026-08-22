-- Separate round-robin cursors for WhatsApp button distribution.
-- These advance independently from the contact-form queue cursors
-- (last_picked_roster_id / tenant_followup_auto_assign_state).

ALTER TABLE tenant_contact_affiliate_links ADD COLUMN wa_last_picked_roster_id INTEGER;
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN wa_last_auto_assigned_user_id INTEGER;
