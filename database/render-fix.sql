-- Render-specific fix script
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
