-- Add contact form customization columns to tenants table
ALTER TABLE tenants ADD COLUMN contact_bg_color TEXT;
ALTER TABLE tenants ADD COLUMN contact_custom_fields TEXT;
