-- Add role-based pricing to vip_pricing table

-- First, let's add a user_role column to the vip_pricing table
ALTER TABLE vip_pricing 
ADD COLUMN IF NOT EXISTS user_role public.user_role DEFAULT 'user';

-- Remove the unique constraint on service_type alone
ALTER TABLE vip_pricing 
DROP CONSTRAINT IF EXISTS vip_pricing_service_type_key;

-- Add a new unique constraint on the combination of service_type and user_role
ALTER TABLE vip_pricing 
ADD CONSTRAINT vip_pricing_service_type_user_role_key 
UNIQUE (service_type, user_role);

-- Insert default pricing for all roles based on existing 'user' prices
-- This will create entries for dealer and autosalon roles with the same prices initially
INSERT INTO vip_pricing (service_type, price, duration_days, is_daily_price, user_role)
SELECT service_type, price, duration_days, is_daily_price, 'dealer'::public.user_role
FROM vip_pricing 
WHERE user_role = 'user'
ON CONFLICT (service_type, user_role) DO NOTHING;

INSERT INTO vip_pricing (service_type, price, duration_days, is_daily_price, user_role)
SELECT service_type, price, duration_days, is_daily_price, 'autosalon'::public.user_role
FROM vip_pricing 
WHERE user_role = 'user'
ON CONFLICT (service_type, user_role) DO NOTHING;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vip_pricing_role_service 
ON vip_pricing(user_role, service_type);

-- Add comment to explain the new structure
COMMENT ON COLUMN vip_pricing.user_role IS 'User role for role-based pricing. Each service can have different prices for different user roles.';