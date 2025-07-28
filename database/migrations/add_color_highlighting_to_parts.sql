-- Migration: Add color highlighting functionality to parts table
-- Created: 2025-07-25
-- Description: Adds color highlighting support to make part listings visually prominent

-- Add color highlighting columns to parts table
ALTER TABLE parts 
ADD COLUMN IF NOT EXISTS color_highlighting_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS color_highlighting_expiration_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS color_highlighting_total_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS color_highlighting_remaining_days INTEGER DEFAULT 0;

-- Create indexes for color highlighting queries
CREATE INDEX IF NOT EXISTS idx_parts_color_highlighting_enabled ON parts (color_highlighting_enabled);
CREATE INDEX IF NOT EXISTS idx_parts_color_highlighting_expiration ON parts (color_highlighting_expiration_date);
-- Create composite index for active color highlighting
CREATE INDEX IF NOT EXISTS idx_parts_color_highlighting_active ON parts (color_highlighting_enabled, color_highlighting_expiration_date) 
WHERE color_highlighting_enabled = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN parts.color_highlighting_enabled IS 'Whether color highlighting is active for this part';
COMMENT ON COLUMN parts.color_highlighting_expiration_date IS 'When the color highlighting service expires';
COMMENT ON COLUMN parts.color_highlighting_total_days IS 'Total number of days the color highlighting service was purchased for';
COMMENT ON COLUMN parts.color_highlighting_remaining_days IS 'Remaining days of color highlighting service';

-- Create trigger for parts color highlighting remaining days (reuses the function from cars)
CREATE TRIGGER trigger_parts_color_highlighting_remaining_days
    BEFORE INSERT OR UPDATE ON parts
    FOR EACH ROW
    EXECUTE FUNCTION update_color_highlighting_remaining_days();