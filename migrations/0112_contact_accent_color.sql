-- Accent color for divider lines, subtitle text, and badge icons on the contact page
ALTER TABLE tenants ADD COLUMN contact_accent_color TEXT;
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN contact_accent_color TEXT;
