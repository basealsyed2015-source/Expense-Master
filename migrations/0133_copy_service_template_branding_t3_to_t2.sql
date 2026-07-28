-- Copy document branding (watermark / header / footer) from tenant 3
-- service templates onto the matching tenant 2 rows.
-- Body HTML and stamp_url are left unchanged.
-- Image URLs stay under contracts/3/... (attachment view is not tenant-gated).

UPDATE contract_templates
SET
  document_watermark_url = (
    SELECT t3.document_watermark_url
    FROM contract_templates t3
    WHERE t3.tenant_id = 3 AND t3.template_name = contract_templates.template_name
  ),
  document_watermark_enabled = (
    SELECT t3.document_watermark_enabled
    FROM contract_templates t3
    WHERE t3.tenant_id = 3 AND t3.template_name = contract_templates.template_name
  ),
  document_watermark_opacity = (
    SELECT t3.document_watermark_opacity
    FROM contract_templates t3
    WHERE t3.tenant_id = 3 AND t3.template_name = contract_templates.template_name
  ),
  document_header_url = (
    SELECT t3.document_header_url
    FROM contract_templates t3
    WHERE t3.tenant_id = 3 AND t3.template_name = contract_templates.template_name
  ),
  document_header_enabled = (
    SELECT t3.document_header_enabled
    FROM contract_templates t3
    WHERE t3.tenant_id = 3 AND t3.template_name = contract_templates.template_name
  ),
  document_header_opacity = (
    SELECT t3.document_header_opacity
    FROM contract_templates t3
    WHERE t3.tenant_id = 3 AND t3.template_name = contract_templates.template_name
  ),
  document_footer_url = (
    SELECT t3.document_footer_url
    FROM contract_templates t3
    WHERE t3.tenant_id = 3 AND t3.template_name = contract_templates.template_name
  ),
  document_footer_enabled = (
    SELECT t3.document_footer_enabled
    FROM contract_templates t3
    WHERE t3.tenant_id = 3 AND t3.template_name = contract_templates.template_name
  ),
  document_footer_opacity = (
    SELECT t3.document_footer_opacity
    FROM contract_templates t3
    WHERE t3.tenant_id = 3 AND t3.template_name = contract_templates.template_name
  )
WHERE tenant_id = 2
  AND template_name IN (
    'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
    'عقد تقديم خدمات وحلول - شركة وصله'
  )
  AND EXISTS (
    SELECT 1
    FROM contract_templates t3
    WHERE t3.tenant_id = 3
      AND t3.template_name = contract_templates.template_name
      AND t3.document_watermark_url IS NOT NULL
  );
