-- Configurable hero text lines shown above the contact form card
ALTER TABLE tenants ADD COLUMN contact_hero_title TEXT;
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN contact_hero_title TEXT;
ALTER TABLE tenants ADD COLUMN contact_hero_subtitle TEXT;
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN contact_hero_subtitle TEXT;
