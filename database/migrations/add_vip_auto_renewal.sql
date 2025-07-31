-- Migration: Add VIP auto-renewal functionality
-- Created: 2025-07-30
-- Description: Adds VIP auto-renewal columns to cars and parts tables

-- Add VIP auto-renewal columns to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS auto_renewal_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_renewal_days INTEGER DEFAULT 1 CHECK (auto_renewal_days > 0),
ADD COLUMN IF NOT EXISTS auto_renewal_last_processed TIMESTAMP;

-- Add VIP auto-renewal columns to parts table
ALTER TABLE parts 
ADD COLUMN IF NOT EXISTS auto_renewal_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_renewal_days INTEGER DEFAULT 1 CHECK (auto_renewal_days > 0),
ADD COLUMN IF NOT EXISTS auto_renewal_last_processed TIMESTAMP;

-- Create indexes for VIP auto-renewal queries
CREATE INDEX IF NOT EXISTS idx_cars_auto_renewal ON cars (auto_renewal_enabled) WHERE auto_renewal_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_parts_auto_renewal ON parts (auto_renewal_enabled) WHERE auto_renewal_enabled = TRUE;

-- Add comments
COMMENT ON COLUMN cars.auto_renewal_enabled IS 'Whether VIP status should auto-renew when it expires';
COMMENT ON COLUMN cars.auto_renewal_days IS 'Number of days for each VIP auto-renewal period';
COMMENT ON COLUMN cars.auto_renewal_last_processed IS 'Last time VIP auto-renewal was processed';

COMMENT ON COLUMN parts.auto_renewal_enabled IS 'Whether VIP status should auto-renew when it expires';
COMMENT ON COLUMN parts.auto_renewal_days IS 'Number of days for each VIP auto-renewal period';
COMMENT ON COLUMN parts.auto_renewal_last_processed IS 'Last time VIP auto-renewal was processed';