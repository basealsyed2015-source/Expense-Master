-- Role 6: dual-capability user (employee + bank agent in same context)
INSERT OR IGNORE INTO roles (id, role_name, role_name_ar, description, is_system_role)
VALUES (6, 'dual_agent', 'موظف مزدوج', 'موظف يمكنه العمل كموظف عادي أو ممثل بنك أو كليهما معاً', 1);

-- Seed role 6 with the union of role 4 (employee) and role 5 (bank agent) permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 6, permission_id FROM role_permissions WHERE role_id IN (4, 5);
