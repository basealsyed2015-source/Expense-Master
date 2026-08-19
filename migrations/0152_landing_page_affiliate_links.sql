-- Landing page affiliate links for tenant 3 (hulool-mawad).
-- Routes hulool and wasla landing page leads through auto distribution
-- (no branch assignment — employees are not yet assigned to branches).

INSERT INTO tenant_contact_affiliate_links
  (tenant_id, path_segment, label, contact_custom_fields)
VALUES
  (3, 'hulool-landing', 'موقع حلول الموعد', '[{"label":"الراتب","required":true,"type":"text"}]'),
  (3, 'wasla-landing',  'موقع وصله',         '[{"label":"الراتب","required":true,"type":"text"}]');
