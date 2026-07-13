-- Restore tenant 3 Waslah template after another accidental browser-translate save.
-- Source: clean Arabic tenant-2 row. Preserve document font-size 9px the user had set.

UPDATE contract_templates
SET
  header_content = (
    SELECT header_content FROM contract_templates
    WHERE tenant_id = 2 AND template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
    LIMIT 1
  ),
  body_content = (
    SELECT
      '<div class="tpl-doc-font" style="font-size:9px;line-height:1.6">' ||
      body_content ||
      '</div>'
    FROM contract_templates
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
