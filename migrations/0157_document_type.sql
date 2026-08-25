-- Add document_type to contracts (immutable after creation)
ALTER TABLE contracts ADD COLUMN document_type TEXT;

-- Backfill all existing contracts as regular contracts
UPDATE contracts SET document_type = 'عقد' WHERE document_type IS NULL;

-- Remap old fine-grained template_type sub-labels to the 4 behavioral categories
UPDATE contract_templates
SET template_type = 'عقد'
WHERE template_type IS NULL
   OR template_type NOT IN ('عقد سلفه', 'مخالصة إلغاء طلب', 'مخالصة انهاء طلب');
