-- Ensure all workflow stages required by Requests UI exist and are active.
-- Safe to run multiple times.

INSERT OR IGNORE INTO workflow_stages (stage_name, stage_name_ar, stage_order, stage_color, stage_icon, is_active) VALUES
('draft', 'مسودة', 1, '#6B7280', 'fa-file', 1),
('submitted', 'تم الإرسال', 2, '#3B82F6', 'fa-paper-plane', 1),
('missing_docs', 'نواقص مستندات', 3, '#F59E0B', 'fa-file-alt', 1),
('processing', 'قيد المعالجة', 4, '#8B5CF6', 'fa-cogs', 1),
('underwriting', 'قيد الدراسة الائتمانية', 5, '#6366F1', 'fa-search', 1),
('conditional_approval', 'موافقة مشروطة', 6, '#EC4899', 'fa-check-double', 1),
('documentation', 'جاهز للتوقيع/توثيق', 7, '#14B8A6', 'fa-pen-fancy', 1),
('approved', 'موافق عليه', 8, '#10B981', 'fa-check-circle', 1),
('final_approval', 'موافقة نهائية', 9, '#10B981', 'fa-check-circle', 1),
('disbursed', 'تم الصرف', 10, '#059669', 'fa-money-bill-wave', 1),
('active', 'نشط/قيد السداد', 11, '#0EA5E9', 'fa-sync', 1),
('closed', 'مُغلق/مسدد', 12, '#64748B', 'fa-archive', 1),
('rejected', 'مرفوض', 13, '#EF4444', 'fa-times-circle', 1),
('cancelled', 'ملغي من العميل', 14, '#78716C', 'fa-ban', 1);

UPDATE workflow_stages
SET is_active = 1
WHERE stage_name IN (
  'draft',
  'submitted',
  'missing_docs',
  'processing',
  'underwriting',
  'conditional_approval',
  'documentation',
  'approved',
  'final_approval',
  'disbursed',
  'active',
  'closed',
  'rejected',
  'cancelled'
);
