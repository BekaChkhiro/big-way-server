-- Complete fix script for Render.com database
-- Set client_min_messages to warning to reduce noise
SET client_min_messages TO warning;

-- Start transaction
BEGIN;

-- First, let's identify and drop the search vector trigger
DO $$
DECLARE
    trigger_name text;
BEGIN
    -- Find the trigger name for search_vector on cars table
    SELECT tgname INTO trigger_name
    FROM pg_trigger
    WHERE tgrelid = 'public.cars'::regclass
    AND tgname LIKE '%search_vector%';
    
    -- Drop the trigger if found
    IF trigger_name IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER ' || trigger_name || ' ON public.cars';
        RAISE NOTICE 'Dropped trigger: %', trigger_name;
    ELSE
        RAISE NOTICE 'No search_vector trigger found on cars table';
    END IF;
END $$;

-- Insert locations with the correct location_type and NULL values for state/country as required
INSERT INTO public.locations (id, city, location_type, is_transit, state, country)
SELECT 1, 'თბილისი', 'city', false, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);

INSERT INTO public.locations (id, city, location_type, is_transit, state, country)
SELECT 2, 'ბათუმი', 'city', false, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 2);

INSERT INTO public.locations (id, city, location_type, is_transit, state, country)
SELECT 3, 'ქუთაისი', 'city', false, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 3);

-- Insert basic specifications
INSERT INTO public.specifications (id)
SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 1);

INSERT INTO public.specifications (id)
SELECT 2 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 2);

INSERT INTO public.specifications (id)
SELECT 3 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 3);

-- Get the structure of the cars table to adapt our insert
DO $$
DECLARE
    has_description boolean := false;
    has_description_en boolean := false;
    insert_sql text;
BEGIN
    -- Check for description column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description'
    ) INTO has_description;
    
    -- Check for description_en column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description_en'
    ) INTO has_description_en;
    
    -- Build the appropriate INSERT statement based on the columns that exist
    IF has_description THEN
        -- Single description field
        insert_sql := '
            INSERT INTO public.cars (
                id, brand_id, category_id, location_id, specification_id, 
                model, year, price, status, featured, seller_id, description
            )
            SELECT 
                1, 1, 1, 1, 1, ''X5'', 2022, 75000.00, ''available'', true, 1,
                ''Luxury SUV in excellent condition''
            WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
              AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 1);
            
            INSERT INTO public.cars (
                id, brand_id, category_id, location_id, specification_id, 
                model, year, price, status, featured, seller_id, description
            )
            SELECT 
                2, 2, 2, 1, 2, ''C-Class'', 2021, 65000.00, ''available'', true, 1,
                ''Elegant sedan with premium features''
            WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
              AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 2);
            
            INSERT INTO public.cars (
                id, brand_id, category_id, location_id, specification_id, 
                model, year, price, status, featured, seller_id, description
            )
            SELECT 
                3, 3, 1, 2, 3, ''A4'', 2020, 45000.00, ''available'', false, 1,
                ''Well-maintained sedan with low mileage''
            WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 2)
              AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 3);
        ';
    ELSIF has_description_en THEN
        -- Multilingual description fields
        insert_sql := '
            INSERT INTO public.cars (
                id, brand_id, category_id, location_id, specification_id, 
                model, year, price, status, featured, seller_id,
                description_en, description_ka, description_ru
            )
            SELECT 
                1, 1, 1, 1, 1, ''X5'', 2022, 75000.00, ''available'', true, 1,
                ''Luxury SUV in excellent condition'', ''ლუქსი SUV შესანიშნავ მდგომარეობაში'', ''Роскошный внедорожник в отличном состоянии''
            WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
              AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 1);
            
            INSERT INTO public.cars (
                id, brand_id, category_id, location_id, specification_id, 
                model, year, price, status, featured, seller_id,
                description_en, description_ka, description_ru
            )
            SELECT 
                2, 2, 2, 1, 2, ''C-Class'', 2021, 65000.00, ''available'', true, 1,
                ''Elegant sedan with premium features'', ''ელეგანტური სედანი პრემიუმ ფუნქციებით'', ''Элегантный седан с премиальными функциями''
            WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
              AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 2);
            
            INSERT INTO public.cars (
                id, brand_id, category_id, location_id, specification_id, 
                model, year, price, status, featured, seller_id,
                description_en, description_ka, description_ru
            )
            SELECT 
                3, 3, 1, 2, 3, ''A4'', 2020, 45000.00, ''available'', false, 1,
                ''Well-maintained sedan with low mileage'', ''კარგად მოვლილი სედანი დაბალი გარბენით'', ''Хорошо обслуживаемый седан с небольшим пробегом''
            WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 2)
              AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 3);
        ';
    ELSE
        -- No description columns, use minimal fields
        insert_sql := '
            INSERT INTO public.cars (
                id, brand_id, category_id, location_id, specification_id, 
                model, year, price, status, featured, seller_id
            )
            SELECT 
                1, 1, 1, 1, 1, ''X5'', 2022, 75000.00, ''available'', true, 1
            WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
              AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 1);
            
            INSERT INTO public.cars (
                id, brand_id, category_id, location_id, specification_id, 
                model, year, price, status, featured, seller_id
            )
            SELECT 
                2, 2, 2, 1, 2, ''C-Class'', 2021, 65000.00, ''available'', true, 1
            WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
              AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 2);
            
            INSERT INTO public.cars (
                id, brand_id, category_id, location_id, specification_id, 
                model, year, price, status, featured, seller_id
            )
            SELECT 
                3, 3, 1, 2, 3, ''A4'', 2020, 45000.00, ''available'', false, 1
            WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 2)
              AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 3);
        ';
    END IF;
    
    -- Execute the constructed SQL
    EXECUTE insert_sql;
    
    -- Log which version was used
    IF has_description THEN
        RAISE NOTICE 'Inserted cars with single description field';
    ELSIF has_description_en THEN
        RAISE NOTICE 'Inserted cars with multilingual description fields';
    ELSE
        RAISE NOTICE 'Inserted cars with minimal fields (no description)';
    END IF;
END $$;

-- Insert car images with all required URL fields
INSERT INTO public.car_images (
    id, car_id, image_url, thumbnail_url, medium_url, large_url, is_primary
)
SELECT 
    1, 1, 
    'https://example.com/images/bmw_1.jpg',
    'https://example.com/images/thumbnails/bmw_1.jpg',
    'https://example.com/images/medium/bmw_1.jpg',
    'https://example.com/images/large/bmw_1.jpg',
    true
WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 1);

INSERT INTO public.car_images (
    id, car_id, image_url, thumbnail_url, medium_url, large_url, is_primary
)
SELECT 
    2, 1, 
    'https://example.com/images/bmw_2.jpg',
    'https://example.com/images/thumbnails/bmw_2.jpg',
    'https://example.com/images/medium/bmw_2.jpg',
    'https://example.com/images/large/bmw_2.jpg',
    false
WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 2);

INSERT INTO public.car_images (
    id, car_id, image_url, thumbnail_url, medium_url, large_url, is_primary
)
SELECT 
    3, 2, 
    'https://example.com/images/mercedes_1.jpg',
    'https://example.com/images/thumbnails/mercedes_1.jpg',
    'https://example.com/images/medium/mercedes_1.jpg',
    'https://example.com/images/large/mercedes_1.jpg',
    true
WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 2)
  AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 3);

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
