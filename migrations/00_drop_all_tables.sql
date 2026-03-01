-- Drop all tables, views, and triggers
-- Run this first to clean the database

PRAGMA foreign_keys = OFF;

-- Drop views and triggers first
DROP VIEW IF EXISTS v_requests_with_stage;
DROP VIEW IF EXISTS v_latest_stage_actions;
DROP TRIGGER IF EXISTS after_stage_change;

-- Drop tables in reverse dependency order (children before parents)
DROP TABLE IF EXISTS workflow_stage_tasks;
DROP TABLE IF EXISTS workflow_stage_actions;
DROP TABLE IF EXISTS workflow_stage_transitions;
DROP TABLE IF EXISTS financing_request_status_history;
DROP TABLE IF EXISTS request_status_history;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS calculations;
DROP TABLE IF EXISTS conversions;
DROP TABLE IF EXISTS password_change_notifications;
DROP TABLE IF EXISTS assignment_history;
DROP TABLE IF EXISTS customer_assignments;
DROP TABLE IF EXISTS financing_requests;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS bank_financing_rates;
DROP TABLE IF EXISTS financing_types;
DROP TABLE IF EXISTS banks;
DROP TABLE IF EXISTS subscription_requests;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS packages;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
-- IMPORTANT: tenants is a parent table for many others (including HR tables),
-- so drop all HR tables BEFORE dropping tenants to avoid FK errors.
DROP TABLE IF EXISTS hr_document_alerts;
DROP TABLE IF EXISTS hr_documents;
DROP TABLE IF EXISTS hr_promotions_transfers;
DROP TABLE IF EXISTS hr_performance_reviews;
DROP TABLE IF EXISTS hr_salaries;
DROP TABLE IF EXISTS hr_leave_balances;
DROP TABLE IF EXISTS hr_leaves;
DROP TABLE IF EXISTS hr_leave_types;
DROP TABLE IF EXISTS hr_attendance;
DROP TABLE IF EXISTS hr_departments;
DROP TABLE IF EXISTS hr_employees;
DROP TABLE IF EXISTS workflow_stages;
DROP TABLE IF EXISTS tenants;

PRAGMA foreign_keys = ON;
