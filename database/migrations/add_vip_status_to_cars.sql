-- Migration: Add VIP status functionality to cars table
-- Created: 2025-07-24
-- Description: Adds VIP status ENUM type and related columns to cars table

-- Create VIP status ENUM type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE vip_status AS ENUM ('none', 'vip', 'vip_plus', 'super_vip');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add VIP-related columns to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS vip_status vip_status DEFAULT 'none',
ADD COLUMN IF NOT EXISTS vip_expiration_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS vip_active BOOLEAN DEFAULT FALSE;

-- Create indexes for VIP status queries
CREATE INDEX IF NOT EXISTS idx_cars_vip_status ON cars (vip_status);
CREATE INDEX IF NOT EXISTS idx_cars_vip_expiration ON cars (vip_expiration_date);
CREATE INDEX IF NOT EXISTS idx_cars_vip_active ON cars (vip_active);

-- Update existing cars to have default VIP status 'none'
UPDATE cars 
SET vip_status = 'none', vip_active = FALSE 
WHERE vip_status IS NULL;

COMMENT ON COLUMN cars.vip_status IS 'VIP status level of the car listing';
COMMENT ON COLUMN cars.vip_expiration_date IS 'Expiration date of the VIP status';
COMMENT ON COLUMN cars.vip_active IS 'Whether VIP status is currently active';