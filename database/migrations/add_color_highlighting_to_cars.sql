-- Migration: Add color highlighting functionality to cars table
-- Created: 2025-07-25
-- Description: Adds color highlighting support to make car listings visually prominent

-- Add color highlighting columns to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS color_highlighting_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS color_highlighting_expiration_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS color_highlighting_total_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS color_highlighting_remaining_days INTEGER DEFAULT 0;

-- Create indexes for color highlighting queries
CREATE INDEX IF NOT EXISTS idx_cars_color_highlighting_enabled ON cars (color_highlighting_enabled);
CREATE INDEX IF NOT EXISTS idx_cars_color_highlighting_expiration ON cars (color_highlighting_expiration_date);
-- Create composite index for active color highlighting
CREATE INDEX IF NOT EXISTS idx_cars_color_highlighting_active ON cars (color_highlighting_enabled, color_highlighting_expiration_date) 
WHERE color_highlighting_enabled = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN cars.color_highlighting_enabled IS 'Whether color highlighting is active for this car';
COMMENT ON COLUMN cars.color_highlighting_expiration_date IS 'When the color highlighting service expires';
COMMENT ON COLUMN cars.color_highlighting_total_days IS 'Total number of days the color highlighting service was purchased for';
COMMENT ON COLUMN cars.color_highlighting_remaining_days IS 'Remaining days of color highlighting service';

-- Create a function to calculate remaining color highlighting days
CREATE OR REPLACE FUNCTION calculate_color_highlighting_remaining_days(
    expiration_date TIMESTAMP
) RETURNS INTEGER AS $$
BEGIN
    IF expiration_date IS NULL OR expiration_date <= NOW() THEN
        RETURN 0;
    END IF;
    
    RETURN GREATEST(0, EXTRACT(DAYS FROM (expiration_date - NOW()))::INTEGER);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a trigger to automatically update remaining days
CREATE OR REPLACE FUNCTION update_color_highlighting_remaining_days()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.color_highlighting_enabled = TRUE AND NEW.color_highlighting_expiration_date IS NOT NULL THEN
        NEW.color_highlighting_remaining_days := calculate_color_highlighting_remaining_days(
            NEW.color_highlighting_expiration_date
        );
    ELSE
        NEW.color_highlighting_remaining_days := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cars_color_highlighting_remaining_days
    BEFORE INSERT OR UPDATE ON cars
    FOR EACH ROW
    EXECUTE FUNCTION update_color_highlighting_remaining_days();