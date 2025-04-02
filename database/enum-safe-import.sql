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
  valid_types text[];
  location_type_to_use text;
BEGIN
  -- Get valid enum values for location_type
  SELECT array_agg(enumlabel::text) INTO valid_types
  FROM pg_enum
  WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'location_type'
  );
  
  -- If location_type is an enum type, use the first valid value
  -- Otherwise, try to use 'city' or NULL if not an enum
  IF valid_types IS NOT NULL AND array_length(valid_types, 1) > 0 THEN
    location_type_to_use := valid_types[1];
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
        location_type_to_use := 'city'; -- Assume 'city' is valid based on memory
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

-- Insert statements for specifications with duplicate handling
INSERT INTO public.specifications (id, fuel_type)
SELECT 73, 'gasoline'
WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 73);

INSERT INTO public.specifications (id, fuel_type)
SELECT 74, 'diesel'
WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 74);

INSERT INTO public.specifications (id, fuel_type)
SELECT 75, 'hybrid'
WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 75);

INSERT INTO public.specifications (id, fuel_type)
SELECT 76, 'electric'
WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 76);

-- Insert statements for users with duplicate handling
INSERT INTO public.users (id, username, email, password, first_name, last_name, age, gender, phone, role, created_at)
SELECT 1, 'dealer1', 'dealer1@bigway.com', '$2b$10$/id1Ay6Ly/MVY3MHAL2vz.BJ7J.xw09E3Nb95RgfFlcAnTb6x.Li.', 'David', 'Brown', '35', 'male', '+995599333333', 'user', '2025-03-10 16:16:23.633315'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = 1);

INSERT INTO public.users (id, username, email, password, first_name, last_name, age, gender, phone, role, created_at)
SELECT 2, 'admin', 'admin@bigway.com', '$2b$10$9FMkLnoynvGrt1q9HhTy.ew9fCNvL3ZDRmkmvwsu0C3wKA4OHnnUq', 'Admin', 'User', '30', 'male', '+995599000000', 'admin', '2025-03-10 16:16:23.633315'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = 2);

-- Reset sequences
SELECT setval('public.brands_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.brands), true);
SELECT setval('public.categories_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.categories), true);
SELECT setval('public.locations_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.locations), true);
SELECT setval('public.specifications_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.specifications), true);
SELECT setval('public.users_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.users), true);

-- Commit transaction
COMMIT;
