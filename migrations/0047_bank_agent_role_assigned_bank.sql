-- Role 5: bank agent — scoped to one bank per company; sees only funding requests for that bank.
INSERT OR IGNORE INTO roles (id, role_name, role_name_ar, description, is_system_role) VALUES
(5, 'bank_agent', 'وكيل بنك', 'عرض طلبات التمويل المرتبطة بالبنك المخصص فقط', 1);

ALTER TABLE users ADD COLUMN assigned_bank_id INTEGER REFERENCES banks(id);
