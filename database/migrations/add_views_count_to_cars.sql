-- Add views_count column to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create index on views_count for better performance when sorting by popularity
CREATE INDEX IF NOT EXISTS idx_cars_views_count ON cars(views_count DESC);

-- Update any existing NULL values to 0 (shouldn't be needed with DEFAULT, but just in case)
UPDATE cars SET views_count = 0 WHERE views_count IS NULL;