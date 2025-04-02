-- Final fix script for Render.com database
-- Set client_min_messages to warning to reduce noise
SET client_min_messages TO warning;

-- Start transaction
BEGIN;

-- Insert locations with the correct location_type and NULL values for state/country as required
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
INSERT INTO public.specifications (id)
SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 1);

INSERT INTO public.specifications (id)
SELECT 2 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 2);

INSERT INTO public.specifications (id)
SELECT 3 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 3);

-- Check if description_en, description_ka, description_ru columns exist
DO $$
DECLARE
    has_description_en boolean;
    has_description_ka boolean;
    has_description_ru boolean;
    has_description boolean;
BEGIN
    -- Check for multilingual description columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description_en'
    ) INTO has_description_en;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description_ka'
    ) INTO has_description_ka;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description_ru'
    ) INTO has_description_ru;
    
    -- Check for single description column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'description'
    ) INTO has_description;
    
    -- Insert cars with appropriate description fields
    IF has_description_en AND has_description_ka AND has_description_ru THEN
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
    ELSIF has_description THEN
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
        -- No description columns found, try with minimal fields
        RAISE NOTICE 'No description columns found, using minimal fields';
        
        -- Temporarily disable triggers on cars table
        ALTER TABLE public.cars DISABLE TRIGGER ALL;
        
        INSERT INTO public.cars (
            id, brand_id, category_id, location_id, specification_id, 
            model, year, price, status, featured, seller_id
        )
        SELECT 
            1, 1, 1, 1, 1, 'X5', 2022, 75000.00, 'available', true, 1
        WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
          AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 1);
        
        INSERT INTO public.cars (
            id, brand_id, category_id, location_id, specification_id, 
            model, year, price, status, featured, seller_id
        )
        SELECT 
            2, 2, 2, 1, 2, 'C-Class', 2021, 65000.00, 'available', true, 1
        WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
          AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 2);
        
        INSERT INTO public.cars (
            id, brand_id, category_id, location_id, specification_id, 
            model, year, price, status, featured, seller_id
        )
        SELECT 
            3, 3, 1, 2, 3, 'A4', 2020, 45000.00, 'available', false, 1
        WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 2)
          AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 3);
        
        -- Re-enable triggers
        ALTER TABLE public.cars ENABLE TRIGGER ALL;
    END IF;
END $$;

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
    
    INSERT INTO public.car_images (id, car_id, image_url, is_primary)
    SELECT 2, 1, 'https://example.com/images/bmw_2.jpg', false
    WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 1)
      AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 2);
    
    INSERT INTO public.car_images (id, car_id, image_url, is_primary)
    SELECT 3, 2, 'https://example.com/images/mercedes_1.jpg', true
    WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 2)
      AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 3);
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
  ELSE
    RAISE NOTICE 'Neither image_url nor url column found in car_images table';
  END IF;
END $$;

-- Reset sequences
SELECT setval('public.locations_id_seq', COALESCE((SELECT MAX(id) FROM public.locations), 0) + 1, false);
SELECT setval('public.specifications_id_seq', COALESCE((SELECT MAX(id) FROM public.specifications), 0) + 1, false);
SELECT setval('public.cars_id_seq', COALESCE((SELECT MAX(id) FROM public.cars), 0) + 1, false);
SELECT setval('public.car_images_id_seq', COALESCE((SELECT MAX(id) FROM public.car_images), 0) + 1, false);

-- Commit transaction
COMMIT;
