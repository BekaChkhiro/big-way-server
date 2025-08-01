-- Multilingual Terms Migration Script
-- Run this script manually in PostgreSQL when the database is available

-- Add language-specific columns to terms_and_conditions table
ALTER TABLE terms_and_conditions 
ADD COLUMN IF NOT EXISTS title_en VARCHAR(500),
ADD COLUMN IF NOT EXISTS title_ru VARCHAR(500),
ADD COLUMN IF NOT EXISTS content_en TEXT,
ADD COLUMN IF NOT EXISTS content_ru TEXT;

-- Rename existing columns to be language-specific (Georgian)
-- Only rename if the old columns still exist
DO $$
BEGIN
    -- Check if 'title' column exists and 'title_ka' doesn't exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='terms_and_conditions' AND column_name='title')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='terms_and_conditions' AND column_name='title_ka') 
    THEN
        ALTER TABLE terms_and_conditions RENAME COLUMN title TO title_ka;
    END IF;
    
    -- Check if 'content' column exists and 'content_ka' doesn't exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='terms_and_conditions' AND column_name='content')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='terms_and_conditions' AND column_name='content_ka')
    THEN
        ALTER TABLE terms_and_conditions RENAME COLUMN content TO content_ka;
    END IF;
END$$;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'terms_and_conditions' 
ORDER BY column_name;