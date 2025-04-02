-- Inspect and fix script for Render.com database
-- Set client_min_messages to warning to reduce noise
SET client_min_messages TO warning;

-- First, let's inspect the constraints and column details
\echo '=== CHECKING CONSTRAINTS ON LOCATIONS TABLE ==='
SELECT conname, pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'locations'
AND n.nspname = 'public'
AND c.contype = 'c';

\echo '=== CHECKING ENUM TYPES ==='
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

\echo '=== CHECKING COLUMN DETAILS FOR LOCATIONS TABLE ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'locations';

-- Now let's try to fix the data with the information we gather
BEGIN;

-- First, let's check if location_type is an enum type
DO $$
DECLARE
    location_type_enum_name text;
    valid_enum_value text;
BEGIN
    -- Check if location_type is an enum type
    SELECT t.typname INTO location_type_enum_name
    FROM pg_type t
    JOIN pg_attribute a ON a.atttypid = t.oid
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'locations'
    AND a.attname = 'location_type'
    AND n.nspname = 'public'
    AND t.typtype = 'e';
    
    IF location_type_enum_name IS NOT NULL THEN
        -- It's an enum, get the first valid value
        SELECT e.enumlabel INTO valid_enum_value
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = location_type_enum_name
        ORDER BY e.enumsortorder
        LIMIT 1;
        
        RAISE NOTICE 'Found enum type % with valid value: %', location_type_enum_name, valid_enum_value;
        
        -- Insert locations with the valid enum value
        INSERT INTO public.locations (id, city, state, country, location_type)
        SELECT 1, 'თბილისი', 'თბილისი', 'საქართველო', valid_enum_value
        WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);
        
        INSERT INTO public.locations (id, city, state, country, location_type)
        SELECT 2, 'ბათუმი', 'აჭარა', 'საქართველო', valid_enum_value
        WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 2);
        
        INSERT INTO public.locations (id, city, state, country, location_type)
        SELECT 3, 'ქუთაისი', 'იმერეთი', 'საქართველო', valid_enum_value
        WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 3);
    ELSE
        -- Not an enum, check for CHECK constraint
        DECLARE
            check_constraint_def text;
            valid_values text[];
            first_valid_value text;
        BEGIN
            -- Get the check constraint definition
            SELECT pg_get_constraintdef(c.oid) INTO check_constraint_def
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            WHERE t.relname = 'locations'
            AND n.nspname = 'public'
            AND c.contype = 'c'
            AND c.conname LIKE '%location_type%';
            
            IF check_constraint_def IS NOT NULL THEN
                -- Extract valid values from the check constraint
                -- This is a simplified approach, might need adjustment based on actual constraint format
                valid_values := ARRAY(
                    SELECT regexp_matches(check_constraint_def, '''([^'']+)''', 'g')
                );
                
                IF array_length(valid_values, 1) > 0 THEN
                    first_valid_value := valid_values[1][1];
                    RAISE NOTICE 'Found check constraint with valid value: %', first_valid_value;
                    
                    -- Insert locations with the valid value
                    INSERT INTO public.locations (id, city, state, country, location_type)
                    SELECT 1, 'თბილისი', 'თბილისი', 'საქართველო', first_valid_value
                    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);
                    
                    INSERT INTO public.locations (id, city, state, country, location_type)
                    SELECT 2, 'ბათუმი', 'აჭარა', 'საქართველო', first_valid_value
                    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 2);
                    
                    INSERT INTO public.locations (id, city, state, country, location_type)
                    SELECT 3, 'ქუთაისი', 'იმერეთი', 'საქართველო', first_valid_value
                    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 3);
                ELSE
                    RAISE NOTICE 'Could not extract valid values from check constraint: %', check_constraint_def;
                END IF;
            ELSE
                RAISE NOTICE 'No check constraint found for location_type';
                
                -- Try with each of the values we know about
                BEGIN
                    INSERT INTO public.locations (id, city, state, country, location_type)
                    SELECT 1, 'თბილისი', 'თბილისი', 'საქართველო', 'city'
                    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);
                EXCEPTION WHEN check_violation THEN
                    BEGIN
                        INSERT INTO public.locations (id, city, state, country, location_type)
                        SELECT 1, 'თბილისი', 'თბილისი', 'საქართველო', 'country'
                        WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);
                    EXCEPTION WHEN check_violation THEN
                        BEGIN
                            INSERT INTO public.locations (id, city, state, country, location_type)
                            SELECT 1, 'თბილისი', 'თბილისი', 'საქართველო', 'special'
                            WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);
                        EXCEPTION WHEN check_violation THEN
                            BEGIN
                                INSERT INTO public.locations (id, city, state, country, location_type)
                                SELECT 1, 'თბილისი', 'თბილისი', 'საქართველო', 'transit'
                                WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);
                            EXCEPTION WHEN check_violation THEN
                                RAISE NOTICE 'All known location_type values failed';
                            END;
                        END;
                    END;
                END;
            END IF;
        END;
    END IF;
END $$;

-- Insert basic specifications
INSERT INTO public.specifications (id)
SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 1);

INSERT INTO public.specifications (id)
SELECT 2 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 2);

INSERT INTO public.specifications (id)
SELECT 3 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 3);

-- Insert sample cars
INSERT INTO public.cars (id, brand_id, category_id, location_id, model, year, price, status, featured, seller_id)
SELECT 1, 1, 1, 1, 'X5', 2022, 75000.00, 'available', true, 1
WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 1);

INSERT INTO public.cars (id, brand_id, category_id, location_id, model, year, price, status, featured, seller_id)
SELECT 2, 2, 2, 1, 'C-Class', 2021, 65000.00, 'available', true, 1
WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 2);

INSERT INTO public.cars (id, brand_id, category_id, location_id, model, year, price, status, featured, seller_id)
SELECT 3, 3, 1, 2, 'A4', 2020, 45000.00, 'available', false, 1
WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 2)
  AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 3);

-- Insert car images (try both url and image_url columns)
DO $$
BEGIN
  -- Check if image_url column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'car_images' 
    AND column_name = 'image_url'
  ) THEN
    -- Use image_url column
    INSERT INTO public.car_images (id, car_id, image_url, is_primary)
    SELECT 1, 1, 'https://example.com/images/bmw_1.jpg', true
    WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 1)
      AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 1);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'car_images' 
    AND column_name = 'url'
  ) THEN
    -- Use url column
    INSERT INTO public.car_images (id, car_id, url, is_primary)
    SELECT 1, 1, 'https://example.com/images/bmw_1.jpg', true
    WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 1)
      AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 1);
  ELSE
    RAISE NOTICE 'Neither image_url nor url column found in car_images table';
  END IF;
END $$;

-- Reset sequences
SELECT setval('public.locations_id_seq', COALESCE((SELECT MAX(id) FROM public.locations), 0) + 1, false);
SELECT setval('public.specifications_id_seq', COALESCE((SELECT MAX(id) FROM public.specifications), 0) + 1, false);
SELECT setval('public.cars_id_seq', COALESCE((SELECT MAX(id) FROM public.cars), 0) + 1, false);
SELECT setval('public.car_images_id_seq', COALESCE((SELECT MAX(id) FROM public.car_images), 0) + 1, false);

-- Show what we've inserted
\echo '=== LOCATIONS AFTER INSERT ==='
SELECT * FROM public.locations;

\echo '=== SPECIFICATIONS AFTER INSERT ==='
SELECT * FROM public.specifications;

\echo '=== CARS AFTER INSERT ==='
SELECT * FROM public.cars;

\echo '=== CAR_IMAGES AFTER INSERT ==='
SELECT * FROM public.car_images;

-- Commit transaction
COMMIT;
