CREATE TRIGGER trg_test_ins AFTER INSERT ON users WHEN NEW.role_id = 5 BEGIN UPDATE users SET tenant_id = 1 WHERE id = NEW.id; END;
