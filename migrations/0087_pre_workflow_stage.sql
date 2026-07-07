-- Phase 0 bucket for notes/actions added before any workflow stage is assigned.

INSERT OR IGNORE INTO workflow_stages (stage_name, stage_name_ar, stage_order, stage_color, stage_icon, is_active)
VALUES ('pre_workflow', 'قبل سير العمل', 0, '#94A3B8', 'fa-hourglass-start', 1);

UPDATE workflow_stages
SET stage_name_ar = 'قبل سير العمل',
    stage_order = 0,
    stage_color = '#94A3B8',
    stage_icon = 'fa-hourglass-start',
    is_active = 1
WHERE stage_name = 'pre_workflow';
