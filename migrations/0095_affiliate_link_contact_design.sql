-- Per-affiliate contact page design (isolated from company path; snapshotted on create).
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN contact_bg_color TEXT;
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN contact_form_color TEXT;
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN contact_text_color TEXT;
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN contact_custom_fields TEXT;

-- Existing links start from the current company path design.
UPDATE tenant_contact_affiliate_links
SET
  contact_bg_color = (SELECT t.contact_bg_color FROM tenants t WHERE t.id = tenant_contact_affiliate_links.tenant_id),
  contact_form_color = (SELECT t.contact_form_color FROM tenants t WHERE t.id = tenant_contact_affiliate_links.tenant_id),
  contact_text_color = (SELECT t.contact_text_color FROM tenants t WHERE t.id = tenant_contact_affiliate_links.tenant_id),
  contact_custom_fields = (SELECT t.contact_custom_fields FROM tenants t WHERE t.id = tenant_contact_affiliate_links.tenant_id);
