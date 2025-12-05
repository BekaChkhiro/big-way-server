-- Migration: Add views_count column to parts table
-- Created: 2025-12-05
-- Description: Adds view count tracking for parts

-- Add views_count column to parts table
ALTER TABLE parts
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create index for views_count queries
CREATE INDEX IF NOT EXISTS idx_parts_views_count ON parts (views_count);

-- Update existing parts to have default views_count of 0
UPDATE parts
SET views_count = 0
WHERE views_count IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN parts.views_count IS 'Number of times this part listing has been viewed';
