-- Background image URL for the affiliate contact page (overrides solid bg color)
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN contact_bg_image_url TEXT;
-- Per-affiliate logo URL (overrides the company logo; defaults to company logo when NULL)
ALTER TABLE tenant_contact_affiliate_links ADD COLUMN contact_logo_url TEXT;
