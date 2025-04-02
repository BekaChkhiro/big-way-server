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

-- Insert statements for locations with duplicate handling
INSERT INTO public.locations (id, city, state, country, location_type)
SELECT 1, 'თბილისი', 'თბილისი', 'საქართველო', 'city'
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);

INSERT INTO public.locations (id, city, state, country, location_type)
SELECT 2, 'ბათუმი', 'აჭარა', 'საქართველო', 'city'
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 2);

INSERT INTO public.locations (id, city, state, country, location_type)
SELECT 3, 'ქუთაისი', 'იმერეთი', 'საქართველო', 'city'
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 3);

INSERT INTO public.locations (id, city, state, country, location_type)
SELECT 15, 'თბილისი', 'თბილისი', 'საქართველო', 'city'
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 15);

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

-- Insert statements for cars with duplicate handling
DO $$
DECLARE
  has_description BOOLEAN;
BEGIN
  -- Check if cars table has a description column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'description'
  ) INTO has_description;
  
  IF has_description THEN
    -- Insert with description
    INSERT INTO public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, status, featured, seller_id, description)
    SELECT 13, 4, 1, 15, 73, 'Giulia', 2022, 77998.00, 'available', true, 1, 'Beautiful Alfa Romeo Giulia'
    WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 13);
  ELSE
    -- Insert without description
    INSERT INTO public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, status, featured, seller_id)
    SELECT 13, 4, 1, 15, 73, 'Giulia', 2022, 77998.00, 'available', true, 1
    WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 13);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting car: %', SQLERRM;
END $$;

-- Insert statements for car_models with duplicate handling
DO $$
BEGIN
  INSERT INTO public.car_models (id, name, brand_id)
  SELECT 1, 'A3', 8
  WHERE NOT EXISTS (SELECT 1 FROM public.car_models WHERE id = 1);
  
  INSERT INTO public.car_models (id, name, brand_id)
  SELECT 2, 'A4', 8
  WHERE NOT EXISTS (SELECT 1 FROM public.car_models WHERE id = 2);
  
  INSERT INTO public.car_models (id, name, brand_id)
  SELECT 3, 'A6', 8
  WHERE NOT EXISTS (SELECT 1 FROM public.car_models WHERE id = 3);
  
  INSERT INTO public.car_models (id, name, brand_id)
  SELECT 4, 'A8', 8
  WHERE NOT EXISTS (SELECT 1 FROM public.car_models WHERE id = 4);
  
  INSERT INTO public.car_models (id, name, brand_id)
  SELECT 5, 'Q3', 8
  WHERE NOT EXISTS (SELECT 1 FROM public.car_models WHERE id = 5);
  
  INSERT INTO public.car_models (id, name, brand_id)
  SELECT 6, 'Q5', 8
  WHERE NOT EXISTS (SELECT 1 FROM public.car_models WHERE id = 6);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting car_models: %', SQLERRM;
END $$;

-- Reset sequences
SELECT setval('public.brands_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.brands), true);
SELECT setval('public.car_images_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.car_images), true);
SELECT setval('public.car_models_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.car_models), true);
SELECT setval('public.cars_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.cars), true);
SELECT setval('public.categories_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.categories), true);
SELECT setval('public.locations_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.locations), true);
SELECT setval('public.specifications_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.specifications), true);
SELECT setval('public.users_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.users), true);
SELECT setval('public.wishlists_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.wishlists), true);

-- Commit transaction
COMMIT;
