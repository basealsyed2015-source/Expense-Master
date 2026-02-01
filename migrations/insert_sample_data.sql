-- Clear existing sample data first (respect FK order)
DELETE FROM financing_requests WHERE id <= 10;
DELETE FROM customers WHERE id <= 10;
DELETE FROM financing_types WHERE id <= 10;

-- Insert financing types (using type_name, not name)
INSERT OR IGNORE INTO financing_types (id, type_name, description, tenant_id, is_active) VALUES
(1, 'تمويل سيارة', 'تمويل لشراء سيارة', 1, 1),
(2, 'تمويل عقاري', 'تمويل لشراء عقار', 1, 1),
(3, 'تمويل شخصي', 'تمويل شخصي للأغراض العامة', 1, 1),
(4, 'تمويل تجاري', 'تمويل للمشاريع التجارية', 1, 1);

-- Insert sample customers (using full_name, not name)
INSERT OR IGNORE INTO customers (id, full_name, phone, email, city, assigned_to, tenant_id, status) VALUES
(1, 'أحمد محمد العلي', '0501234567', 'ahmed@email.com', 'الرياض', 3, 1, 'active'),
(2, 'فاطمة عبدالله السالم', '0509876543', 'fatima@email.com', 'الرياض', 3, 1, 'active'),
(3, 'خالد سعيد الغامدي', '0551234567', 'khalid@email.com', 'جدة', 4, 1, 'active'),
(4, 'نورة حسن الشمري', '0559876543', 'noura@email.com', 'الدمام', 3, 1, 'active'),
(5, 'محمد عمر القحطاني', '0561234567', 'mohammed@email.com', 'الرياض', 4, 1, 'active'),
(6, 'سارة علي المطيري', '0569876543', 'sara@email.com', 'جدة', 3, 1, 'active'),
(7, 'عبدالرحمن ناصر الدوسري', '0571234567', 'abdulrahman@email.com', 'الخبر', 4, 1, 'active'),
(8, 'مريم يوسف الزهراني', '0579876543', 'mariam@email.com', 'الرياض', 3, 1, 'active');
