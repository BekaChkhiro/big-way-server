-- Set client_min_messages to warning to reduce noise
SET client_min_messages TO warning;

-- Start transaction
BEGIN;

-- First, let's check the structure of the locations table
DO $$
DECLARE
  location_columns text[];
  query_text text;
BEGIN
  -- Get column names for locations table
  SELECT array_agg(column_name::text) INTO location_columns
  FROM information_schema.columns
  WHERE table_name = 'locations';
  
  RAISE NOTICE 'Location columns: %', location_columns;
  
  -- Insert locations with the right columns
  IF location_columns IS NOT NULL THEN
    INSERT INTO public.locations (id, city, state, country)
    SELECT 1, 'თბილისი', 'თბილისი', 'საქართველო'
    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);
    
    INSERT INTO public.locations (id, city, state, country)
    SELECT 2, 'ბათუმი', 'აჭარა', 'საქართველო'
    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 2);
    
    INSERT INTO public.locations (id, city, state, country)
    SELECT 3, 'ქუთაისი', 'იმერეთი', 'საქართველო'
    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 3);
    
    INSERT INTO public.locations (id, city, state, country)
    SELECT 15, 'თბილისი', 'თბილისი', 'საქართველო'
    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 15);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting locations: %', SQLERRM;
END $$;

-- Check and fix specifications table
DO $$
DECLARE
  spec_columns text[];
  query_text text;
BEGIN
  -- Get column names for specifications table
  SELECT array_agg(column_name::text) INTO spec_columns
  FROM information_schema.columns
  WHERE table_name = 'specifications';
  
  RAISE NOTICE 'Specification columns: %', spec_columns;
  
  -- Insert specifications with minimal required fields
  IF spec_columns IS NOT NULL THEN
    -- Just insert ID if that's all we can safely do
    INSERT INTO public.specifications (id)
    SELECT 73
    WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 73);
    
    INSERT INTO public.specifications (id)
    SELECT 74
    WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 74);
    
    INSERT INTO public.specifications (id)
    SELECT 75
    WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 75);
    
    INSERT INTO public.specifications (id)
    SELECT 76
    WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 76);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting specifications: %', SQLERRM;
END $$;

-- Now let's insert cars with minimal required fields
DO $$
DECLARE
  car_columns text[];
  required_columns text[];
  missing_columns text[];
  i int;
BEGIN
  -- Get column names for cars table
  SELECT array_agg(column_name::text) INTO car_columns
  FROM information_schema.columns
  WHERE table_name = 'cars';
  
  -- Define required columns for cars
  required_columns := ARRAY['id', 'brand_id', 'category_id', 'location_id', 'model', 'year', 'price', 'status'];
  
  -- Check if all required columns exist
  missing_columns := ARRAY[]::text[];
  FOR i IN 1..array_length(required_columns, 1) LOOP
    IF NOT required_columns[i] = ANY(car_columns) THEN
      missing_columns := array_append(missing_columns, required_columns[i]);
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Car columns: %', car_columns;
  RAISE NOTICE 'Missing required columns: %', missing_columns;
  
  -- Only proceed if we have all required columns
  IF array_length(missing_columns, 1) IS NULL OR array_length(missing_columns, 1) = 0 THEN
    -- Insert cars with minimal fields
    INSERT INTO public.cars (id, brand_id, category_id, location_id, model, year, price, status, featured, seller_id)
    SELECT 13, 4, 1, 1, 'Giulia', 2022, 77998.00, 'available', true, 1
    WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 13);
    
    INSERT INTO public.cars (id, brand_id, category_id, location_id, model, year, price, status, featured, seller_id)
    SELECT 14, 12, 4, 1, 'X5', 2021, 85000.00, 'available', true, 1
    WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 14);
    
    INSERT INTO public.cars (id, brand_id, category_id, location_id, model, year, price, status, featured, seller_id)
    SELECT 15, 8, 1, 2, 'A4', 2020, 45000.00, 'available', false, 1
    WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 15);
  ELSE
    RAISE NOTICE 'Cannot insert cars due to missing required columns';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting cars: %', SQLERRM;
END $$;

-- Insert car_images with the right column structure
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
      INSERT INTO public.car_images (id, car_id, %I, is_primary)
      SELECT 1, 13, ''https://example.com/images/alfa_romeo_1.jpg'', true
      WHERE NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 1);
      
      INSERT INTO public.car_images (id, car_id, %I, is_primary)
      SELECT 2, 13, ''https://example.com/images/alfa_romeo_2.jpg'', false
      WHERE NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 2);
      
      INSERT INTO public.car_images (id, car_id, %I, is_primary)
      SELECT 3, 14, ''https://example.com/images/bmw_x5_1.jpg'', true
      WHERE NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 3);
    ', url_column, url_column, url_column);
  ELSE
    RAISE NOTICE 'Could not find URL column in car_images table. Skipping car_images import.';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting car_images: %', SQLERRM;
END $$;

-- Reset sequences
DO $$
BEGIN
  PERFORM setval('public.locations_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.locations), true);
  PERFORM setval('public.specifications_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.specifications), true);
  PERFORM setval('public.cars_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.cars), true);
  PERFORM setval('public.car_images_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.car_images), true);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error resetting sequences: %', SQLERRM;
END $$;

-- Commit transaction
COMMIT;
