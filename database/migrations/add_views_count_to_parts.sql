-- Add views_count column to parts table
ALTER TABLE parts 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create index on views_count for better performance when sorting by popularity
CREATE INDEX IF NOT EXISTS idx_parts_views_count ON parts(views_count DESC);

-- Update any existing NULL values to 0 (shouldn't be needed with DEFAULT, but just in case)
UPDATE parts SET views_count = 0 WHERE views_count IS NULL;