-- Migration: Add auto-renewal functionality to cars table
-- Created: 2025-07-25
-- Description: Adds auto-renewal support to automatically refresh car created_at dates

-- Add auto-renewal columns to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS auto_renewal_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_renewal_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS auto_renewal_expiration_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS auto_renewal_last_processed TIMESTAMP,
ADD COLUMN IF NOT EXISTS auto_renewal_total_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_renewal_remaining_days INTEGER DEFAULT 0;

-- Create indexes for auto-renewal queries
CREATE INDEX IF NOT EXISTS idx_cars_auto_renewal_enabled ON cars (auto_renewal_enabled);
CREATE INDEX IF NOT EXISTS idx_cars_auto_renewal_expiration ON cars (auto_renewal_expiration_date);
-- Create composite index without NOW() function (which is not immutable)
CREATE INDEX IF NOT EXISTS idx_cars_auto_renewal_processing ON cars (auto_renewal_enabled, auto_renewal_expiration_date) 
WHERE auto_renewal_enabled = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN cars.auto_renewal_enabled IS 'Whether auto-renewal is active for this car';
COMMENT ON COLUMN cars.auto_renewal_days IS 'How often to refresh the car (in days)';
COMMENT ON COLUMN cars.auto_renewal_expiration_date IS 'When the auto-renewal service expires';
COMMENT ON COLUMN cars.auto_renewal_last_processed IS 'Last time the car was auto-renewed';
COMMENT ON COLUMN cars.auto_renewal_total_days IS 'Total number of days the auto-renewal service was purchased for';
COMMENT ON COLUMN cars.auto_renewal_remaining_days IS 'Remaining days of auto-renewal service';

-- Create a function to calculate remaining auto-renewal days
CREATE OR REPLACE FUNCTION calculate_auto_renewal_remaining_days(
    expiration_date TIMESTAMP,
    last_processed TIMESTAMP
) RETURNS INTEGER AS $$
BEGIN
    IF expiration_date IS NULL OR expiration_date <= NOW() THEN
        RETURN 0;
    END IF;
    
    RETURN GREATEST(0, EXTRACT(DAYS FROM (expiration_date - NOW()))::INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update remaining days
CREATE OR REPLACE FUNCTION update_auto_renewal_remaining_days()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.auto_renewal_enabled = TRUE AND NEW.auto_renewal_expiration_date IS NOT NULL THEN
        NEW.auto_renewal_remaining_days := calculate_auto_renewal_remaining_days(
            NEW.auto_renewal_expiration_date,
            NEW.auto_renewal_last_processed
        );
    ELSE
        NEW.auto_renewal_remaining_days := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cars_auto_renewal_remaining_days
    BEFORE INSERT OR UPDATE ON cars
    FOR EACH ROW
    EXECUTE FUNCTION update_auto_renewal_remaining_days();