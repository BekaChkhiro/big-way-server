-- Simple fix script for Render.com database
-- Set client_min_messages to warning to reduce noise
SET client_min_messages TO warning;

-- Start transaction
BEGIN;

-- First, check the valid enum values for location_type
DO $$
DECLARE
  valid_location_types text[];
  chosen_type text;
BEGIN
  -- Check if location_type is an enum
  SELECT array_agg(e.enumlabel::text)
  INTO valid_location_types
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  WHERE t.typname = 'location_type';
  
  -- If it's not an enum, check the CHECK constraint
  IF valid_location_types IS NULL THEN
    SELECT array_agg(substring(CHECK_CLAUSE from '''([^'']+)'''))
    INTO valid_location_types
    FROM information_schema.check_constraints
    WHERE constraint_name = 'locations_location_type_check';
  END IF;
  
  -- Log the valid types
  RAISE NOTICE 'Valid location types: %', valid_location_types;
  
  -- Choose the first valid type or NULL if none found
  IF valid_location_types IS NOT NULL AND array_length(valid_location_types, 1) > 0 THEN
    chosen_type := valid_location_types[1];
  ELSE
    chosen_type := NULL;
  END IF;
  
  -- Insert locations with the chosen type
  INSERT INTO public.locations (id, city, state, country, location_type)
  SELECT 1, 'თბილისი', 'თბილისი', 'საქართველო', chosen_type
  WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);
  
  INSERT INTO public.locations (id, city, state, country, location_type)
  SELECT 2, 'ბათუმი', 'აჭარა', 'საქართველო', chosen_type
  WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 2);
  
  INSERT INTO public.locations (id, city, state, country, location_type)
  SELECT 3, 'ქუთაისი', 'იმერეთი', 'საქართველო', chosen_type
  WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 3);
  
  -- If that fails, try without location_type
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting with location_type: %', SQLERRM;
    
    INSERT INTO public.locations (id, city, state, country)
    SELECT 1, 'თბილისი', 'თბილისი', 'საქართველო'
    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);
    
    INSERT INTO public.locations (id, city, state, country)
    SELECT 2, 'ბათუმი', 'აჭარა', 'საქართველო'
    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 2);
    
    INSERT INTO public.locations (id, city, state, country)
    SELECT 3, 'ქუთაისი', 'იმერეთი', 'საქართველო'
    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 3);
END $$;

-- Insert basic specifications with fuel_type check
DO $$
DECLARE
  valid_fuel_types text[];
  chosen_fuel_type text;
  spec_columns text[];
BEGIN
  -- Get specification columns
  SELECT array_agg(column_name::text)
  INTO spec_columns
  FROM information_schema.columns
  WHERE table_name = 'specifications';
  
  RAISE NOTICE 'Specification columns: %', spec_columns;
  
  -- Check if fuel_type is an enum
  SELECT array_agg(e.enumlabel::text)
  INTO valid_fuel_types
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  WHERE t.typname = 'fuel_type';
  
  -- If it's not an enum, check the CHECK constraint
  IF valid_fuel_types IS NULL THEN
    SELECT array_agg(substring(CHECK_CLAUSE from '''([^'']+)'''))
    INTO valid_fuel_types
    FROM information_schema.check_constraints
    WHERE constraint_name LIKE '%fuel_type%';
  END IF;
  
  RAISE NOTICE 'Valid fuel types: %', valid_fuel_types;
  
  -- Choose the first valid type or NULL if none found
  IF valid_fuel_types IS NOT NULL AND array_length(valid_fuel_types, 1) > 0 THEN
    chosen_fuel_type := valid_fuel_types[1];
  ELSE
    chosen_fuel_type := NULL;
  END IF;
  
  -- Insert specifications with minimal fields
  IF spec_columns IS NOT NULL THEN
    -- Try with fuel_type if it exists
    IF 'fuel_type' = ANY(spec_columns) AND chosen_fuel_type IS NOT NULL THEN
      BEGIN
        INSERT INTO public.specifications (id, fuel_type)
        SELECT 1, chosen_fuel_type
        WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 1);
        
        INSERT INTO public.specifications (id, fuel_type)
        SELECT 2, chosen_fuel_type
        WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 2);
        
        INSERT INTO public.specifications (id, fuel_type)
        SELECT 3, chosen_fuel_type
        WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 3);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting specifications with fuel_type: %', SQLERRM;
        -- Fall back to just ID
        INSERT INTO public.specifications (id)
        SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 1);
        
        INSERT INTO public.specifications (id)
        SELECT 2 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 2);
        
        INSERT INTO public.specifications (id)
        SELECT 3 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 3);
      END;
    ELSE
      -- Just insert with ID
      INSERT INTO public.specifications (id)
      SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 1);
      
      INSERT INTO public.specifications (id)
      SELECT 2 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 2);
      
      INSERT INTO public.specifications (id)
      SELECT 3 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 3);
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in specifications block: %', SQLERRM;
END $$;

-- Insert sample cars with dynamic column detection
DO $$
DECLARE
  car_columns text[];
  required_columns text[];
  missing_columns text[];
  i int;
  query_text text;
BEGIN
  -- Get column names for cars table
  SELECT array_agg(column_name::text) INTO car_columns
  FROM information_schema.columns
  WHERE table_name = 'cars';
  
  RAISE NOTICE 'Car columns: %', car_columns;
  
  -- Define minimal required columns for cars
  required_columns := ARRAY['id', 'brand_id', 'model', 'year', 'price'];
  
  -- Check if all required columns exist
  missing_columns := ARRAY[]::text[];
  FOR i IN 1..array_length(required_columns, 1) LOOP
    IF NOT required_columns[i] = ANY(car_columns) THEN
      missing_columns := array_append(missing_columns, required_columns[i]);
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Missing required columns: %', missing_columns;
  
  -- Only proceed if we have all required columns
  IF array_length(missing_columns, 1) IS NULL OR array_length(missing_columns, 1) = 0 THEN
    -- Build dynamic query with only existing columns
    query_text := 'INSERT INTO public.cars (id, brand_id';
    
    -- Add optional columns if they exist
    IF 'category_id' = ANY(car_columns) THEN query_text := query_text || ', category_id'; END IF;
    IF 'location_id' = ANY(car_columns) THEN query_text := query_text || ', location_id'; END IF;
    IF 'model' = ANY(car_columns) THEN query_text := query_text || ', model'; END IF;
    IF 'year' = ANY(car_columns) THEN query_text := query_text || ', year'; END IF;
    IF 'price' = ANY(car_columns) THEN query_text := query_text || ', price'; END IF;
    IF 'status' = ANY(car_columns) THEN query_text := query_text || ', status'; END IF;
    IF 'featured' = ANY(car_columns) THEN query_text := query_text || ', featured'; END IF;
    IF 'seller_id' = ANY(car_columns) THEN query_text := query_text || ', seller_id'; END IF;
    
    -- Values part
    query_text := query_text || ') SELECT 1, 1';
    
    -- Add values for optional columns
    IF 'category_id' = ANY(car_columns) THEN query_text := query_text || ', 1'; END IF;
    IF 'location_id' = ANY(car_columns) THEN query_text := query_text || ', 1'; END IF;
    IF 'model' = ANY(car_columns) THEN query_text := query_text || ', ''X5'''; END IF;
    IF 'year' = ANY(car_columns) THEN query_text := query_text || ', 2022'; END IF;
    IF 'price' = ANY(car_columns) THEN query_text := query_text || ', 75000.00'; END IF;
    IF 'status' = ANY(car_columns) THEN query_text := query_text || ', ''available'''; END IF;
    IF 'featured' = ANY(car_columns) THEN query_text := query_text || ', true'; END IF;
    IF 'seller_id' = ANY(car_columns) THEN query_text := query_text || ', 1'; END IF;
    
    -- Add WHERE clause
    query_text := query_text || ' WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 1)';
    
    RAISE NOTICE 'Executing query: %', query_text;
    EXECUTE query_text;
    
    -- Second car
    query_text := 'INSERT INTO public.cars (id, brand_id';
    
    -- Add optional columns if they exist
    IF 'category_id' = ANY(car_columns) THEN query_text := query_text || ', category_id'; END IF;
    IF 'location_id' = ANY(car_columns) THEN query_text := query_text || ', location_id'; END IF;
    IF 'model' = ANY(car_columns) THEN query_text := query_text || ', model'; END IF;
    IF 'year' = ANY(car_columns) THEN query_text := query_text || ', year'; END IF;
    IF 'price' = ANY(car_columns) THEN query_text := query_text || ', price'; END IF;
    IF 'status' = ANY(car_columns) THEN query_text := query_text || ', status'; END IF;
    IF 'featured' = ANY(car_columns) THEN query_text := query_text || ', featured'; END IF;
    IF 'seller_id' = ANY(car_columns) THEN query_text := query_text || ', seller_id'; END IF;
    
    -- Values part
    query_text := query_text || ') SELECT 2, 2';
    
    -- Add values for optional columns
    IF 'category_id' = ANY(car_columns) THEN query_text := query_text || ', 2'; END IF;
    IF 'location_id' = ANY(car_columns) THEN query_text := query_text || ', 1'; END IF;
    IF 'model' = ANY(car_columns) THEN query_text := query_text || ', ''C-Class'''; END IF;
    IF 'year' = ANY(car_columns) THEN query_text := query_text || ', 2021'; END IF;
    IF 'price' = ANY(car_columns) THEN query_text := query_text || ', 65000.00'; END IF;
    IF 'status' = ANY(car_columns) THEN query_text := query_text || ', ''available'''; END IF;
    IF 'featured' = ANY(car_columns) THEN query_text := query_text || ', true'; END IF;
    IF 'seller_id' = ANY(car_columns) THEN query_text := query_text || ', 1'; END IF;
    
    -- Add WHERE clause
    query_text := query_text || ' WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 2)';
    
    EXECUTE query_text;
  ELSE
    RAISE NOTICE 'Cannot insert cars due to missing required columns';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting cars: %', SQLERRM;
END $$;

-- Insert car images with dynamic column detection
DO $$
DECLARE
  image_columns text[];
  url_column text;
  query_text text;
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
    -- Build dynamic query
    query_text := format('INSERT INTO public.car_images (id, car_id, %I, is_primary) 
      SELECT 1, 1, ''https://example.com/images/bmw_1.jpg'', true 
      WHERE NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 1)', url_column);
      
    RAISE NOTICE 'Executing query: %', query_text;
    EXECUTE query_text;
    
    -- Second image
    query_text := format('INSERT INTO public.car_images (id, car_id, %I, is_primary) 
      SELECT 2, 1, ''https://example.com/images/bmw_2.jpg'', false 
      WHERE NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 2)', url_column);
      
    EXECUTE query_text;
  ELSE
    RAISE NOTICE 'Could not find URL column in car_images table. Skipping car_images import.';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting car_images: %', SQLERRM;
END $$;

-- Reset sequences
SELECT setval('public.locations_id_seq', COALESCE((SELECT MAX(id) FROM public.locations), 0) + 1, false);
SELECT setval('public.specifications_id_seq', COALESCE((SELECT MAX(id) FROM public.specifications), 0) + 1, false);
SELECT setval('public.cars_id_seq', COALESCE((SELECT MAX(id) FROM public.cars), 0) + 1, false);
SELECT setval('public.car_images_id_seq', COALESCE((SELECT MAX(id) FROM public.car_images), 0) + 1, false);

-- Commit transaction
COMMIT;
