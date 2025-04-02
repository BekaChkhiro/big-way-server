-- Set client_min_messages to warning to reduce noise
SET client_min_messages TO warning;

-- Start transaction
BEGIN;

-- Insert cars with adaptive approach to handle schema differences
DO $$
DECLARE
  car_columns text[];
  column_exists boolean;
  query_text text;
BEGIN
  -- Get column names for cars table
  SELECT array_agg(column_name::text) INTO car_columns
  FROM information_schema.columns
  WHERE table_name = 'cars';
  
  RAISE NOTICE 'Car columns: %', car_columns;
  
  -- Check if specific columns exist
  SELECT 'description' = ANY(car_columns) INTO column_exists;
  
  -- Build dynamic insert query based on existing columns
  IF column_exists THEN
    -- Insert with description
    INSERT INTO public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, status, featured, seller_id, description)
    SELECT 13, 4, 1, 1, 73, 'Giulia', 2022, 77998.00, 'available', true, 1, 'Beautiful Alfa Romeo Giulia'
    WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 13);
    
    INSERT INTO public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, status, featured, seller_id, description)
    SELECT 14, 12, 4, 1, 73, 'X5', 2021, 85000.00, 'available', true, 1, 'Powerful BMW X5 SUV'
    WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 14);
    
    INSERT INTO public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, status, featured, seller_id, description)
    SELECT 15, 8, 1, 2, 74, 'A4', 2020, 45000.00, 'available', false, 1, 'Elegant Audi A4 Sedan'
    WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 15);
  ELSE
    -- Insert without description
    INSERT INTO public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, status, featured, seller_id)
    SELECT 13, 4, 1, 1, 73, 'Giulia', 2022, 77998.00, 'available', true, 1
    WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 13);
    
    INSERT INTO public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, status, featured, seller_id)
    SELECT 14, 12, 4, 1, 73, 'X5', 2021, 85000.00, 'available', true, 1
    WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 14);
    
    INSERT INTO public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, status, featured, seller_id)
    SELECT 15, 8, 1, 2, 74, 'A4', 2020, 45000.00, 'available', false, 1
    WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 15);
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting cars: %', SQLERRM;
END $$;

-- Insert car_images with adaptive approach
DO $$
DECLARE
  image_columns text[];
  url_column text;
BEGIN
  -- Get column names for car_images table
  SELECT array_agg(column_name::text) INTO image_columns
  FROM information_schema.columns
  WHERE table_name = 'car_images';
  
  RAISE NOTICE 'Car image columns: %', image_columns;
  
  -- Determine which URL column to use (url or image_url)
  IF 'image_url' = ANY(image_columns) THEN
    url_column := 'image_url';
  ELSIF 'url' = ANY(image_columns) THEN
    url_column := 'url';
  ELSE
    url_column := NULL;
  END IF;
  
  -- Insert car images if we have a valid URL column
  IF url_column IS NOT NULL THEN
    -- Build and execute dynamic query
    EXECUTE format('
      INSERT INTO public.car_images (id, car_id, %I, is_main)
      SELECT 1, 13, ''https://example.com/images/alfa_romeo_1.jpg'', true
      WHERE NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 1);
      
      INSERT INTO public.car_images (id, car_id, %I, is_main)
      SELECT 2, 13, ''https://example.com/images/alfa_romeo_2.jpg'', false
      WHERE NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 2);
      
      INSERT INTO public.car_images (id, car_id, %I, is_main)
      SELECT 3, 14, ''https://example.com/images/bmw_x5_1.jpg'', true
      WHERE NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 3);
    ', url_column, url_column, url_column);
  ELSE
    RAISE NOTICE 'Could not find URL column in car_images table. Skipping car_images import.';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting car_images: %', SQLERRM;
END $$;

-- Reset sequences for newly added tables
DO $$
BEGIN
  PERFORM setval('public.cars_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.cars), true);
  PERFORM setval('public.car_images_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.car_images), true);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error resetting sequences: %', SQLERRM;
END $$;

-- Commit transaction
COMMIT;
