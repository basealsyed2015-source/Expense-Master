-- Copy the two document-mode "service & solutions" contract templates onto
-- tenant 3 (حلول الموعد). Source of truth: tenant 2 rows already in production.
--
-- Safety:
--   • INSERT-only — no UPDATE/DELETE on any existing row.
--   • NOT EXISTS per template_name — idempotent; safe to re-run.
--   • Does not touch tenant 3's existing template (e.g. "تمويل عقاري", id 5).
--   • render_mode = 'document' so contract-view uses body_content rendering.

INSERT INTO contract_templates (
  tenant_id,
  template_name,
  template_type,
  header_content,
  body_content,
  footer_content,
  variables_list,
  is_active,
  court_city,
  render_mode
)
SELECT
  3,
  t.template_name,
  t.template_type,
  t.header_content,
  t.body_content,
  t.footer_content,
  t.variables_list,
  t.is_active,
  t.court_city,
  'document'
FROM contract_templates t
WHERE t.tenant_id = 2
  AND t.render_mode = 'document'
  AND t.template_name IN (
    'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
    'عقد تقديم خدمات وحلول - شركة وصله'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM contract_templates existing
    WHERE existing.tenant_id = 3
      AND existing.template_name = t.template_name
  );
