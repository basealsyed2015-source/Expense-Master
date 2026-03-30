-- Seed workflow_stages for "تحديث المرحلة" dropdown on مراحل سير عمل الطلب page
-- Uses INSERT OR IGNORE so re-running does not duplicate (stage_name is UNIQUE)

INSERT OR IGNORE INTO workflow_stages (stage_name, stage_name_ar, stage_order, stage_color, stage_icon, is_active) VALUES
('draft', 'مسودة', 1, '#6B7280', 'fa-file', 1),
('submitted', 'تم الإرسال', 2, '#3B82F6', 'fa-paper-plane', 1),
('missing_docs', 'نواقص مستندات', 3, '#F59E0B', 'fa-file-alt', 1),
('processing', 'قيد المعالجة', 4, '#8B5CF6', 'fa-cogs', 1),
('underwriting', 'قيد الدراسة الائتمانية', 5, '#6366F1', 'fa-search', 1),
('conditional_approval', 'موافقة مشروطة', 6, '#EC4899', 'fa-check-double', 1),
('documentation', 'جاهز للتوقيع/توثيق', 7, '#14B8A6', 'fa-pen-fancy', 1),
('final_approval', 'موافقة نهائية', 8, '#10B981', 'fa-check-circle', 1),
('disbursed', 'تم الصرف', 9, '#059669', 'fa-money-bill-wave', 1),
('active', 'نشط/قيد السداد', 10, '#0EA5E9', 'fa-sync', 1),
('closed', 'مُغلق/مسدد', 11, '#64748B', 'fa-archive', 1),
('rejected', 'مرفوض', 12, '#EF4444', 'fa-times-circle', 1),
('cancelled', 'ملغي من العميل', 13, '#78716C', 'fa-ban', 1);
