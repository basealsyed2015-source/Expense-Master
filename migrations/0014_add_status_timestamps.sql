-- Add timestamp columns for all status changes
-- This migration adds columns to track when each status was set

-- Add new timestamp columns
ALTER TABLE financing_requests ADD COLUMN pending_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE financing_requests ADD COLUMN under_review_at TIMESTAMP;
ALTER TABLE financing_requests ADD COLUMN processing_at TIMESTAMP;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_financing_requests_status_timestamps 
ON financing_requests(pending_at, under_review_at, processing_at, approved_at, rejected_at);

-- Note: approved_at, rejected_at, and reviewed_at already exist in the table
