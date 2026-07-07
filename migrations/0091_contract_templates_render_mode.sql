-- Per-template rendering mode for the contracts module.
--
-- 'structured' (default) = existing hardcoded contract-view layout (unchanged behavior
--                          for all existing templates and their contracts).
-- 'document'             = render the printed/viewed contract directly from the template
--                          body_content with {{variable}} substitution. Used for full
--                          legal documents that embed their own company header + clauses.
--
-- Additive, nullable-with-default column: safe on existing data, changes no existing rows'
-- behavior. Only the two "service & solutions" templates seeded in 0090 opt in.

ALTER TABLE contract_templates ADD COLUMN render_mode TEXT DEFAULT 'structured';

UPDATE contract_templates
SET render_mode = 'document'
WHERE tenant_id = 2
  AND template_name IN (
    'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
    'عقد تقديم خدمات وحلول - شركة وصله'
  );
