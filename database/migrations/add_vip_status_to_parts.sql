-- Migration: Add VIP status functionality to parts table
-- Created: 2025-07-25
-- Description: Adds VIP status support to parts table (reuses existing vip_status ENUM type)

-- Note: The vip_status ENUM type already exists from the cars migration
-- Values: 'none', 'vip', 'vip_plus', 'super_vip'

-- Add VIP-related columns to parts table
ALTER TABLE parts 
ADD COLUMN IF NOT EXISTS vip_status vip_status DEFAULT 'none',
ADD COLUMN IF NOT EXISTS vip_expiration_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS vip_active BOOLEAN DEFAULT FALSE;

-- Create indexes for VIP status queries on parts table
CREATE INDEX IF NOT EXISTS idx_parts_vip_status ON parts (vip_status);
CREATE INDEX IF NOT EXISTS idx_parts_vip_expiration ON parts (vip_expiration_date);
CREATE INDEX IF NOT EXISTS idx_parts_vip_active ON parts (vip_active);

-- Update existing parts to have default VIP status 'none' and inactive
UPDATE parts 
SET vip_status = 'none', vip_active = FALSE 
WHERE vip_status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN parts.vip_status IS 'VIP status level of the parts listing (none, vip, vip_plus, super_vip)';
COMMENT ON COLUMN parts.vip_expiration_date IS 'Expiration date of the VIP status';
COMMENT ON COLUMN parts.vip_active IS 'Whether VIP status is currently active and not expired';

-- Add composite index for VIP active parts queries
CREATE INDEX IF NOT EXISTS idx_parts_vip_active_status ON parts (vip_active, vip_status) WHERE vip_active = TRUE;

-- Add index for VIP expiration cleanup queries
CREATE INDEX IF NOT EXISTS idx_parts_vip_expiration_active ON parts (vip_expiration_date) WHERE vip_active = TRUE;