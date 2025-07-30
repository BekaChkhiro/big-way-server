-- Migration: Add trigger to automatically set vip_expiration_date to NULL when vip_status is 'none'

-- Function to enforce VIP status rules
CREATE OR REPLACE FUNCTION enforce_vip_status_rules()
RETURNS TRIGGER AS $$
BEGIN
    -- If vip_status is set to 'none', automatically set vip_expiration_date to NULL
    IF NEW.vip_status = 'none' THEN
        NEW.vip_expiration_date := NULL;
        NEW.vip_active := FALSE;
    END IF;
    
    -- If vip_status is not 'none' and vip_expiration_date is NULL, set vip_active to FALSE
    IF NEW.vip_status != 'none' AND NEW.vip_expiration_date IS NULL THEN
        NEW.vip_active := FALSE;
    END IF;
    
    -- If vip_status is not 'none' and vip_expiration_date is in the future, set vip_active to TRUE
    IF NEW.vip_status != 'none' AND NEW.vip_expiration_date IS NOT NULL AND NEW.vip_expiration_date > NOW() THEN
        NEW.vip_active := TRUE;
    END IF;
    
    -- If vip_expiration_date is in the past, set vip_active to FALSE
    IF NEW.vip_expiration_date IS NOT NULL AND NEW.vip_expiration_date <= NOW() THEN
        NEW.vip_active := FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cars table
DROP TRIGGER IF EXISTS enforce_cars_vip_status_trigger ON cars;
CREATE TRIGGER enforce_cars_vip_status_trigger
    BEFORE INSERT OR UPDATE ON cars
    FOR EACH ROW
    EXECUTE FUNCTION enforce_vip_status_rules();

-- Create trigger for parts table  
DROP TRIGGER IF EXISTS enforce_parts_vip_status_trigger ON parts;
CREATE TRIGGER enforce_parts_vip_status_trigger
    BEFORE INSERT OR UPDATE ON parts
    FOR EACH ROW
    EXECUTE FUNCTION enforce_vip_status_rules();

-- Comment on the function
COMMENT ON FUNCTION enforce_vip_status_rules() IS 'Automatically enforces VIP status consistency rules:
1. When vip_status = ''none'', sets vip_expiration_date = NULL and vip_active = FALSE
2. Manages vip_active flag based on vip_status and expiration date
3. Ensures data consistency across all VIP-related updates';