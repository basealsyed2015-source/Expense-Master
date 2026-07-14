-- Configurable trust badge labels shown below the contact form
ALTER TABLE tenants ADD COLUMN contact_trust_badges TEXT;
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN contact_trust_badges TEXT;
