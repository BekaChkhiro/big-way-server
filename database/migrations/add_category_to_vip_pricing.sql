-- Migration: Add category column to vip_pricing table
-- This allows separate pricing for cars and parts

-- Create enum type for category if it doesn't exist
DO $$ BEGIN
    CREATE TYPE vip_category_enum AS ENUM ('cars', 'parts');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add category column to vip_pricing table
ALTER TABLE vip_pricing 
ADD COLUMN IF NOT EXISTS category vip_category_enum DEFAULT 'cars';

-- Drop the old unique constraint
ALTER TABLE vip_pricing 
DROP CONSTRAINT IF EXISTS vip_pricing_service_type_user_role_key;

-- Add new unique constraint including category
ALTER TABLE vip_pricing 
ADD CONSTRAINT vip_pricing_service_type_user_role_category_key 
UNIQUE (service_type, user_role, category);

-- Insert default prices for parts category based on existing cars prices
INSERT INTO vip_pricing (service_type, price, duration_days, is_daily_price, user_role, category)
SELECT 
    service_type, 
    price, 
    duration_days, 
    is_daily_price, 
    user_role, 
    'parts' as category
FROM vip_pricing 
WHERE category = 'cars'
ON CONFLICT (service_type, user_role, category) DO NOTHING;

-- Update existing records to have 'cars' category
UPDATE vip_pricing SET category = 'cars' WHERE category IS NULL;