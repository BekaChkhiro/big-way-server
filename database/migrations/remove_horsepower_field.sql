-- Migration to remove the horsepower field from the specifications table

-- Check if the horsepower column exists in the specifications table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'specifications' AND column_name = 'horsepower'
    ) THEN
        -- Remove the horsepower column
        ALTER TABLE specifications DROP COLUMN horsepower;
        RAISE NOTICE 'Horsepower column has been removed from the specifications table';
    ELSE
        RAISE NOTICE 'Horsepower column does not exist in the specifications table';
    END IF;
END $$;
