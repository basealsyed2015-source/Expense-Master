-- Migration: إضافة حقول الحاسبة الكاملة لجدول العملاء
-- Date: 2025-12-17
-- Purpose: حفظ جميع بيانات الحاسبة مع العميل (المدة، أفضل بنك، إلخ)
-- Note: birthdate already exists from migration 0002

-- Add financing_duration_months column
ALTER TABLE customers ADD COLUMN financing_duration_months INTEGER;

-- Add best_bank_id column (أفضل بنك حسب نتائج الحاسبة)
ALTER TABLE customers ADD COLUMN best_bank_id INTEGER;

-- Add best_rate column (أفضل نسبة فائدة)
ALTER TABLE customers ADD COLUMN best_rate REAL;

-- Add monthly_payment column (القسط الشهري المقترح)
ALTER TABLE customers ADD COLUMN monthly_payment REAL;

-- Add total_payment column (إجمالي المبلغ المستحق)
ALTER TABLE customers ADD COLUMN total_payment REAL;

-- Add calculation_date column (تاريخ آخر حساب)
ALTER TABLE customers ADD COLUMN calculation_date DATETIME;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_best_bank ON customers(best_bank_id);
CREATE INDEX IF NOT EXISTS idx_customers_calculation_date ON customers(calculation_date);
