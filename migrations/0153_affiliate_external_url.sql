-- Allows an affiliate link to point to an external landing page URL.
-- When set, the admin list shows this URL (instead of the auto-generated
-- tamweel-calc.com path) and hides the page-design button.

ALTER TABLE tenant_contact_affiliate_links
  ADD COLUMN external_url TEXT;

UPDATE tenant_contact_affiliate_links
SET external_url = 'https://huloolmawad.com/'
WHERE tenant_id = 3 AND path_segment = 'hulool-landing';

UPDATE tenant_contact_affiliate_links
SET external_url = 'https://huloolwasla.com/'
WHERE tenant_id = 3 AND path_segment = 'wasla-landing';
