-- Track how a customer was enrolled/created (affiliate/task vs calculator)
-- enrollment_source: 'affiliate' | 'calculator' | NULL
-- enrollment_source_label: affiliate label when source = 'affiliate'

ALTER TABLE customers ADD COLUMN enrollment_source TEXT;
ALTER TABLE customers ADD COLUMN enrollment_source_label TEXT;

