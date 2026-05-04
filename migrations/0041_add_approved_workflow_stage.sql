-- Add explicit "approved" stage for workflow dropdown/source of truth.
-- Keeps existing "final_approval" stage intact for backward compatibility.
INSERT OR IGNORE INTO workflow_stages (
  stage_name,
  stage_name_ar,
  stage_order,
  stage_color,
  stage_icon,
  is_active
) VALUES (
  'approved',
  'موافق عليه',
  8,
  '#10B981',
  'fa-check-circle',
  1
);
