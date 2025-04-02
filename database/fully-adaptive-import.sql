-- Set client_min_messages to warning to reduce noise
SET client_min_messages TO warning;

-- Start transaction
BEGIN;

-- Insert statements for brands with duplicate handling
INSERT INTO public.brands (id, name, created_at)
SELECT 1, 'Acura', '2025-03-10 16:16:23.633315'
WHERE NOT EXISTS (SELECT 1 FROM public.brands WHERE id = 1);

INSERT INTO public.brands (id, name, created_at)
SELECT 2, 'Aion', '2025-03-10 16:16:23.633315'
WHERE NOT EXISTS (SELECT 1 FROM public.brands WHERE id = 2);

INSERT INTO public.brands (id, name, created_at)
SELECT 3, 'AIQAR', '2025-03-10 16:16:23.633315'
WHERE NOT EXISTS (SELECT 1 FROM public.brands WHERE id = 3);

INSERT INTO public.brands (id, name, created_at)
SELECT 4, 'Alfa Romeo', '2025-03-10 16:16:23.633315'
WHERE NOT EXISTS (SELECT 1 FROM public.brands WHERE id = 4);

INSERT INTO public.brands (id, name, created_at)
SELECT 5, 'AMC', '2025-03-10 16:16:23.633315'
WHERE NOT EXISTS (SELECT 1 FROM public.brands WHERE id = 5);

-- Insert statements for categories with duplicate handling
INSERT INTO public.categories (id, name, created_at)
SELECT 1, 'სედანი', '2025-03-19 17:55:50.210825'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE id = 1);

INSERT INTO public.categories (id, name, created_at)
SELECT 2, 'ჰეტჩბეკი', '2025-03-19 17:55:50.211629'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE id = 2);

INSERT INTO public.categories (id, name, created_at)
SELECT 3, 'კუპე', '2025-03-19 17:55:50.212249'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE id = 3);

INSERT INTO public.categories (id, name, created_at)
SELECT 4, 'ჯიპი', '2025-03-19 17:55:50.212868'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE id = 4);

INSERT INTO public.categories (id, name, created_at)
SELECT 5, 'უნივერსალი', '2025-03-19 17:55:50.213488'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE id = 5);

-- Check location_type enum values and insert locations accordingly
DO $$
DECLARE
  valid_location_types text[];
  location_type_to_use text;
BEGIN
  -- Get valid enum values for location_type if it's an enum
  SELECT array_agg(enumlabel::text) INTO valid_location_types
  FROM pg_enum
  WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'location_type'
  );
  
  -- If location_type is an enum type, use the first valid value
  -- Otherwise, try to use 'city' or NULL if not an enum
  IF valid_location_types IS NOT NULL AND array_length(valid_location_types, 1) > 0 THEN
    location_type_to_use := valid_location_types[1];
    RAISE NOTICE 'Using location_type: %', location_type_to_use;
  ELSE
    -- Check if location_type is a character varying with check constraint
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'locations' 
      AND column_name = 'location_type'
    ) THEN
      -- Try to determine valid values from check constraint
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.locations'::regclass
        AND conname = 'locations_location_type_check'
      ) THEN
        location_type_to_use := NULL; -- Use NULL to avoid constraint issues
      ELSE
        location_type_to_use := NULL; -- No constraint, use NULL
      END IF;
    ELSE
      location_type_to_use := NULL; -- Column doesn't exist, use NULL
    END IF;
  END IF;
  
  -- Insert locations with the determined location_type
  IF location_type_to_use IS NOT NULL THEN
    -- Insert with location_type
    INSERT INTO public.locations (id, city, state, country, location_type)
    SELECT 1, 'თბილისი', 'თბილისი', 'საქართველო', location_type_to_use
    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);
    
    INSERT INTO public.locations (id, city, state, country, location_type)
    SELECT 2, 'ბათუმი', 'აჭარა', 'საქართველო', location_type_to_use
    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 2);
    
    INSERT INTO public.locations (id, city, state, country, location_type)
    SELECT 3, 'ქუთაისი', 'იმერეთი', 'საქართველო', location_type_to_use
    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 3);
    
    INSERT INTO public.locations (id, city, state, country, location_type)
    SELECT 15, 'თბილისი', 'თბილისი', 'საქართველო', location_type_to_use
    WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 15);
  ELSE
    -- Insert without location_type
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

-- Check fuel_type enum values and insert specifications accordingly
DO $$
DECLARE
  valid_fuel_types text[];
  fuel_type_to_use text;
  spec_columns text[];
BEGIN
  -- Get valid enum values for fuel_type if it's an enum
  SELECT array_agg(enumlabel::text) INTO valid_fuel_types
  FROM pg_enum
  WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'fuel_type'
  );
  
  -- Get column names for specifications table
  SELECT array_agg(column_name::text) INTO spec_columns
  FROM information_schema.columns
  WHERE table_name = 'specifications';
  
  -- If fuel_type is an enum type, use the first valid value
  IF valid_fuel_types IS NOT NULL AND array_length(valid_fuel_types, 1) > 0 THEN
    fuel_type_to_use := valid_fuel_types[1];
    RAISE NOTICE 'Using fuel_type: %', fuel_type_to_use;
    
    -- Insert with fuel_type
    INSERT INTO public.specifications (id, fuel_type)
    SELECT 73, fuel_type_to_use
    WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 73);
    
    INSERT INTO public.specifications (id, fuel_type)
    SELECT 74, fuel_type_to_use
    WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 74);
    
    INSERT INTO public.specifications (id, fuel_type)
    SELECT 75, fuel_type_to_use
    WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 75);
    
    INSERT INTO public.specifications (id, fuel_type)
    SELECT 76, fuel_type_to_use
    WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 76);
  ELSE
    -- Insert without fuel_type if it doesn't exist
    IF spec_columns IS NOT NULL AND array_length(spec_columns, 1) > 0 THEN
      IF 'id' = ANY(spec_columns) THEN
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
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting specifications: %', SQLERRM;
END $$;

-- Insert statements for users with duplicate handling
DO $$
BEGIN
  INSERT INTO public.users (id, username, email, password, first_name, last_name, age, gender, phone, role, created_at)
  SELECT 1, 'dealer1', 'dealer1@bigway.com', '$2b$10$/id1Ay6Ly/MVY3MHAL2vz.BJ7J.xw09E3Nb95RgfFlcAnTb6x.Li.', 'David', 'Brown', '35', 'male', '+995599333333', 'user', '2025-03-10 16:16:23.633315'
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = 1);
  
  INSERT INTO public.users (id, username, email, password, first_name, last_name, age, gender, phone, role, created_at)
  SELECT 2, 'admin', 'admin@bigway.com', '$2b$10$9FMkLnoynvGrt1q9HhTy.ew9fCNvL3ZDRmkmvwsu0C3wKA4OHnnUq', 'Admin', 'User', '30', 'male', '+995599000000', 'admin', '2025-03-10 16:16:23.633315'
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = 2);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting users: %', SQLERRM;
END $$;

-- Reset sequences
DO $$
BEGIN
  PERFORM setval('public.brands_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.brands), true);
  PERFORM setval('public.categories_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.categories), true);
  PERFORM setval('public.locations_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.locations), true);
  PERFORM setval('public.specifications_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.specifications), true);
  PERFORM setval('public.users_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.users), true);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error resetting sequences: %', SQLERRM;
END $$;

-- Commit transaction
COMMIT;
