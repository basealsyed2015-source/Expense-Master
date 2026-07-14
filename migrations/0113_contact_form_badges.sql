-- Configurable trust badge labels shown inside the form, above the divider line
ALTER TABLE tenants ADD COLUMN contact_form_badges TEXT;
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN contact_form_badges TEXT;
