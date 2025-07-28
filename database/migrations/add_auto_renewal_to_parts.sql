-- Migration: Add auto-renewal functionality to parts table
-- Created: 2025-07-25
-- Description: Adds auto-renewal support to automatically refresh part created_at dates

-- Add auto-renewal columns to parts table
ALTER TABLE parts 
ADD COLUMN IF NOT EXISTS auto_renewal_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_renewal_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS auto_renewal_expiration_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS auto_renewal_last_processed TIMESTAMP,
ADD COLUMN IF NOT EXISTS auto_renewal_total_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_renewal_remaining_days INTEGER DEFAULT 0;

-- Create indexes for auto-renewal queries
CREATE INDEX IF NOT EXISTS idx_parts_auto_renewal_enabled ON parts (auto_renewal_enabled);
CREATE INDEX IF NOT EXISTS idx_parts_auto_renewal_expiration ON parts (auto_renewal_expiration_date);
-- Create composite index without NOW() function (which is not immutable)
CREATE INDEX IF NOT EXISTS idx_parts_auto_renewal_processing ON parts (auto_renewal_enabled, auto_renewal_expiration_date) 
WHERE auto_renewal_enabled = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN parts.auto_renewal_enabled IS 'Whether auto-renewal is active for this part';
COMMENT ON COLUMN parts.auto_renewal_days IS 'How often to refresh the part (in days)';
COMMENT ON COLUMN parts.auto_renewal_expiration_date IS 'When the auto-renewal service expires';
COMMENT ON COLUMN parts.auto_renewal_last_processed IS 'Last time the part was auto-renewed';
COMMENT ON COLUMN parts.auto_renewal_total_days IS 'Total number of days the auto-renewal service was purchased for';
COMMENT ON COLUMN parts.auto_renewal_remaining_days IS 'Remaining days of auto-renewal service';

-- Create trigger for parts auto-renewal remaining days (reuses the function from cars)
CREATE TRIGGER trigger_parts_auto_renewal_remaining_days
    BEFORE INSERT OR UPDATE ON parts
    FOR EACH ROW
    EXECUTE FUNCTION update_auto_renewal_remaining_days();