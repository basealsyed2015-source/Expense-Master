-- Migration: Create notifications table
-- Date: 2026-01-03

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  tenant_id INTEGER,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Insert sample notifications
INSERT INTO notifications (user_id, tenant_id, title, message, type) VALUES 
(11, NULL, 'مرحباً بك في النظام', 'تم تسجيل دخولك بنجاح كمدير نظام SaaS', 'success'),
(5, 2, 'طلب تمويل جديد', 'لديك طلب تمويل جديد يحتاج للمراجعة', 'info'),
(6, 2, 'تحديث الحالة', 'تم تحديث حالة طلب التمويل الخاص بك', 'warning');
