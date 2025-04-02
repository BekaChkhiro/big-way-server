-- Trigger fix script for Render.com database
-- Set client_min_messages to warning to reduce noise
SET client_min_messages TO warning;

-- Start transaction
BEGIN;

-- First, let's check the existing trigger function
\echo '=== CHECKING EXISTING TRIGGER FUNCTION ==='
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'cars_search_vector_update';

-- Drop and recreate the trigger function to be compatible with our schema
\echo '=== UPDATING TRIGGER FUNCTION ==='
CREATE OR REPLACE FUNCTION cars_search_vector_update() RETURNS trigger AS $$
BEGIN
    -- Check which description fields exist and use them accordingly
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description'
    ) THEN
        -- Single description field
        NEW.search_vector :=
            setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
            setweight(to_tsvector('english', (
                SELECT string_agg(name, ' ')
                FROM brands
                WHERE id = NEW.brand_id
            )), 'A');
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description_en'
    ) THEN
        -- Multilingual description fields
        NEW.search_vector :=
            setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.description_en, '')), 'B') ||
            setweight(to_tsvector('english', (
                SELECT string_agg(name, ' ')
                FROM brands
                WHERE id = NEW.brand_id
            )), 'A');
    ELSE
        -- No description fields, use only model and brand
        NEW.search_vector :=
            setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
            setweight(to_tsvector('english', (
                SELECT string_agg(name, ' ')
                FROM brands
                WHERE id = NEW.brand_id
            )), 'A');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Now insert locations with the correct location_type and NULL values for state/country as required
\echo '=== INSERTING LOCATIONS ==='
INSERT INTO public.locations (id, city, location_type, is_transit, state, country)
SELECT 1, 'თბილისი', 'georgia', false, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);

INSERT INTO public.locations (id, city, location_type, is_transit, state, country)
SELECT 2, 'ბათუმი', 'georgia', false, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 2);

INSERT INTO public.locations (id, city, location_type, is_transit, state, country)
SELECT 3, 'ქუთაისი', 'georgia', false, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 3);

-- Insert basic specifications
\echo '=== INSERTING SPECIFICATIONS ==='
INSERT INTO public.specifications (id)
SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 1);

INSERT INTO public.specifications (id)
SELECT 2 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 2);

INSERT INTO public.specifications (id)
SELECT 3 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 3);

-- Check the cars table structure
\echo '=== CHECKING CARS TABLE STRUCTURE ==='
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'cars'
ORDER BY ordinal_position;

-- Insert sample cars
\echo '=== INSERTING CARS ==='
-- Try with description_en field
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description_en'
    ) THEN
        -- Use multilingual description columns
        INSERT INTO public.cars (
            id, brand_id, category_id, location_id, specification_id, 
            model, year, price, status, featured, seller_id,
            description_en, description_ka, description_ru
        )
        SELECT 
            1, 1, 1, 1, 1, 'X5', 2022, 75000.00, 'available', true, 1,
            'Luxury SUV in excellent condition', 'ლუქსი SUV შესანიშნავ მდგომარეობაში', 'Роскошный внедорожник в отличном состоянии'
        WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
          AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 1);
        
        RAISE NOTICE 'Inserted car with multilingual descriptions';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description'
    ) THEN
        -- Use single description column
        INSERT INTO public.cars (
            id, brand_id, category_id, location_id, specification_id, 
            model, year, price, status, featured, seller_id,
            description
        )
        SELECT 
            1, 1, 1, 1, 1, 'X5', 2022, 75000.00, 'available', true, 1,
            'Luxury SUV in excellent condition'
        WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
          AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 1);
        
        RAISE NOTICE 'Inserted car with single description';
    ELSE
        -- No description columns found, use minimal fields
        INSERT INTO public.cars (
            id, brand_id, category_id, location_id, specification_id, 
            model, year, price, status, featured, seller_id
        )
        SELECT 
            1, 1, 1, 1, 1, 'X5', 2022, 75000.00, 'available', true, 1
        WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
          AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 1);
        
        RAISE NOTICE 'Inserted car with minimal fields';
    END IF;
    
    -- Insert more cars using the same pattern
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description_en'
    ) THEN
        -- Use multilingual description columns
        INSERT INTO public.cars (
            id, brand_id, category_id, location_id, specification_id, 
            model, year, price, status, featured, seller_id,
            description_en, description_ka, description_ru
        )
        SELECT 
            2, 2, 2, 1, 2, 'C-Class', 2021, 65000.00, 'available', true, 1,
            'Elegant sedan with premium features', 'ელეგანტური სედანი პრემიუმ ფუნქციებით', 'Элегантный седан с премиальными функциями'
        WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
          AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 2);
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description'
    ) THEN
        -- Use single description column
        INSERT INTO public.cars (
            id, brand_id, category_id, location_id, specification_id, 
            model, year, price, status, featured, seller_id,
            description
        )
        SELECT 
            2, 2, 2, 1, 2, 'C-Class', 2021, 65000.00, 'available', true, 1,
            'Elegant sedan with premium features'
        WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
          AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 2);
    ELSE
        -- No description columns found, use minimal fields
        INSERT INTO public.cars (
            id, brand_id, category_id, location_id, specification_id, 
            model, year, price, status, featured, seller_id
        )
        SELECT 
            2, 2, 2, 1, 2, 'C-Class', 2021, 65000.00, 'available', true, 1
        WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
          AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 2);
    END IF;
    
    -- One more car
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description_en'
    ) THEN
        -- Use multilingual description columns
        INSERT INTO public.cars (
            id, brand_id, category_id, location_id, specification_id, 
            model, year, price, status, featured, seller_id,
            description_en, description_ka, description_ru
        )
        SELECT 
            3, 3, 1, 2, 3, 'A4', 2020, 45000.00, 'available', false, 1,
            'Well-maintained sedan with low mileage', 'კარგად მოვლილი სედანი დაბალი გარბენით', 'Хорошо обслуживаемый седан с небольшим пробегом'
        WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 2)
          AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 3);
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description'
    ) THEN
        -- Use single description column
        INSERT INTO public.cars (
            id, brand_id, category_id, location_id, specification_id, 
            model, year, price, status, featured, seller_id,
            description
        )
        SELECT 
            3, 3, 1, 2, 3, 'A4', 2020, 45000.00, 'available', false, 1,
            'Well-maintained sedan with low mileage'
        WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 2)
          AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 3);
    ELSE
        -- No description columns found, use minimal fields
        INSERT INTO public.cars (
            id, brand_id, category_id, location_id, specification_id, 
            model, year, price, status, featured, seller_id
        )
        SELECT 
            3, 3, 1, 2, 3, 'A4', 2020, 45000.00, 'available', false, 1
        WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 2)
          AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 3);
    END IF;
END $$;

-- Insert car images (try both url and image_url columns)
\echo '=== INSERTING CAR IMAGES ==='
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
    
    INSERT INTO public.car_images (id, car_id, image_url, is_primary)
    SELECT 2, 1, 'https://example.com/images/bmw_2.jpg', false
    WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 1)
      AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 2);
    
    INSERT INTO public.car_images (id, car_id, image_url, is_primary)
    SELECT 3, 2, 'https://example.com/images/mercedes_1.jpg', true
    WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 2)
      AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 3);
    
    RAISE NOTICE 'Inserted car images using image_url column';
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
    
    INSERT INTO public.car_images (id, car_id, url, is_primary)
    SELECT 2, 1, 'https://example.com/images/bmw_2.jpg', false
    WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 1)
      AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 2);
    
    INSERT INTO public.car_images (id, car_id, url, is_primary)
    SELECT 3, 2, 'https://example.com/images/mercedes_1.jpg', true
    WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 2)
      AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 3);
    
    RAISE NOTICE 'Inserted car images using url column';
  ELSE
    RAISE NOTICE 'Neither image_url nor url column found in car_images table';
  END IF;
END $$;

-- Reset sequences
\echo '=== RESETTING SEQUENCES ==='
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
