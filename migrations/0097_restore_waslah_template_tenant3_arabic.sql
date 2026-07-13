-- Restore tenant 3 "عقد تقديم خدمات وحلول - شركة وصله" to the original Arabic
-- document body. The tenant-3 copy was corrupted by an accidental English
-- (browser) translation of the rich-HTML body (~183KB of Mso HTML with
-- "Whereas"/"Article"/etc). Source of truth: tenant 2 row (plain Arabic text
-- with {{day_name}} already applied).

UPDATE contract_templates
SET
  header_content = (
    SELECT header_content FROM contract_templates
    WHERE tenant_id = 2 AND template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
    LIMIT 1
  ),
  body_content = (
    SELECT body_content FROM contract_templates
    WHERE tenant_id = 2 AND template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
    LIMIT 1
  ),
  footer_content = (
    SELECT footer_content FROM contract_templates
    WHERE tenant_id = 2 AND template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
    LIMIT 1
  ),
  variables_list = (
    SELECT variables_list FROM contract_templates
    WHERE tenant_id = 2 AND template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
    LIMIT 1
  ),
  template_type = (
    SELECT template_type FROM contract_templates
    WHERE tenant_id = 2 AND template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
    LIMIT 1
  ),
  court_city = (
    SELECT court_city FROM contract_templates
    WHERE tenant_id = 2 AND template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
    LIMIT 1
  ),
  is_active = (
    SELECT is_active FROM contract_templates
    WHERE tenant_id = 2 AND template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
    LIMIT 1
  ),
  render_mode = 'document'
WHERE tenant_id = 3
  AND template_name = 'عقد تقديم خدمات وحلول - شركة وصله';
