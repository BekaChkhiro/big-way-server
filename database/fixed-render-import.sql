-- Set client_min_messages to warning to reduce noise
SET client_min_messages TO warning;

-- Start transaction
BEGIN;

-- Insert statements for brands
INSERT INTO public.brands ON CONFLICT (id) DO NOTHING VALUES ('1', 'Acura', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands ON CONFLICT (id) DO NOTHING VALUES ('2', 'Aion', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands ON CONFLICT (id) DO NOTHING VALUES ('3', 'AIQAR', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands ON CONFLICT (id) DO NOTHING VALUES ('4', 'Alfa Romeo', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands ON CONFLICT (id) DO NOTHING VALUES ('5', 'AMC', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands ON CONFLICT (id) DO NOTHING VALUES ('6', 'Arcfox', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands ON CONFLICT (id) DO NOTHING VALUES ('7', 'Aston Martin', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands ON CONFLICT (id) DO NOTHING VALUES ('8', 'Audi', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands ON CONFLICT (id) DO NOTHING VALUES ('9', 'Avatr', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands ON CONFLICT (id) DO NOTHING VALUES ('10', 'Baic', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands ON CONFLICT (id) DO NOTHING VALUES ('11', 'Bentley', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands ON CONFLICT (id) DO NOTHING VALUES ('12', 'BMW', '2025-03-10 16:16:23.633315');

-- Insert statements for categories
INSERT INTO public.categories ON CONFLICT (id) DO NOTHING VALUES ('1', 'სედანი', '2025-03-19 17:55:50.210825');
INSERT INTO public.categories ON CONFLICT (id) DO NOTHING VALUES ('2', 'ჰეტჩბეკი', '2025-03-19 17:55:50.211629');
INSERT INTO public.categories ON CONFLICT (id) DO NOTHING VALUES ('3', 'კუპე', '2025-03-19 17:55:50.212249');
INSERT INTO public.categories ON CONFLICT (id) DO NOTHING VALUES ('4', 'ჯიპი', '2025-03-19 17:55:50.212868');
INSERT INTO public.categories ON CONFLICT (id) DO NOTHING VALUES ('5', 'უნივერსალი', '2025-03-19 17:55:50.213488');
INSERT INTO public.categories ON CONFLICT (id) DO NOTHING VALUES ('6', 'კაბრიოლეტი', '2025-03-19 17:55:50.214146');
INSERT INTO public.categories ON CONFLICT (id) DO NOTHING VALUES ('7', 'პიკაპი', '2025-03-19 17:55:50.214694');
INSERT INTO public.categories ON CONFLICT (id) DO NOTHING VALUES ('8', 'მინივენი', '2025-03-19 17:55:50.215231');
INSERT INTO public.categories ON CONFLICT (id) DO NOTHING VALUES ('9', 'ლიმუზინი', '2025-03-19 17:55:50.215767');
INSERT INTO public.categories ON CONFLICT (id) DO NOTHING VALUES ('10', 'მიკროავტობუსი', '2025-03-19 17:55:50.216304');

-- Insert statements for locations
INSERT INTO public.locations ON CONFLICT (id) DO NOTHING VALUES ('1', 'თბილისი', 'თბილისი', 'საქართველო', 'city');
INSERT INTO public.locations ON CONFLICT (id) DO NOTHING VALUES ('2', 'ბათუმი', 'აჭარა', 'საქართველო', 'city');
INSERT INTO public.locations ON CONFLICT (id) DO NOTHING VALUES ('3', 'ქუთაისი', 'იმერეთი', 'საქართველო', 'city');
INSERT INTO public.locations ON CONFLICT (id) DO NOTHING VALUES ('4', 'რუსთავი', 'ქვემო ქართლი', 'საქართველო', 'city');
INSERT INTO public.locations ON CONFLICT (id) DO NOTHING VALUES ('5', 'ფოთი', 'სამეგრელო', 'საქართველო', 'city');
INSERT INTO public.locations ON CONFLICT (id) DO NOTHING VALUES ('15', 'თბილისი', 'თბილისი', 'საქართველო', 'city');

-- Insert statements for specifications
INSERT INTO public.specifications ON CONFLICT (id) DO NOTHING VALUES ('73', 'gasoline');
INSERT INTO public.specifications ON CONFLICT (id) DO NOTHING VALUES ('74', 'diesel');
INSERT INTO public.specifications ON CONFLICT (id) DO NOTHING VALUES ('75', 'hybrid');
INSERT INTO public.specifications ON CONFLICT (id) DO NOTHING VALUES ('76', 'electric');

-- Insert statements for users
INSERT INTO public.users ON CONFLICT (id) DO NOTHING VALUES ('1', 'dealer1', 'dealer1@bigway.com', '$2b$10$/id1Ay6Ly/MVY3MHAL2vz.BJ7J.xw09E3Nb95RgfFlcAnTb6x.Li.', 'David', 'Brown', '35', 'male', '+995599333333', 'user', '2025-03-10 16:16:23.633315');
INSERT INTO public.users ON CONFLICT (id) DO NOTHING VALUES ('2', 'admin', 'admin@bigway.com', '$2b$10$9FMkLnoynvGrt1q9HhTy.ew9fCNvL3ZDRmkmvwsu0C3wKA4OHnnUq', 'Admin', 'User', '30', 'male', '+995599000000', 'admin', '2025-03-10 16:16:23.633315');
INSERT INTO public.users ON CONFLICT (id) DO NOTHING VALUES ('3', 'johndoe', 'john@example.com', '$2b$10$Tyb6EDq.VFOkHRjT/Rf6DeQZpcIeXyz..FvPzBYqF/ihV/K1px5Na', 'John', 'Doe', '25', 'male', '+995599111111', 'user', '2025-03-10 16:16:23.633315');

-- Insert statements for cars (simplified to avoid errors)
DO $$
BEGIN
  -- Check if cars table has a description column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'description'
  ) THEN
    -- Insert with description
    INSERT INTO public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, status, featured, seller_id, description) 
    VALUES (13, 4, 1, 15, 73, 'Giulia', 2022, 77998.00, 'available', true, 1, 'Beautiful Alfa Romeo Giulia')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Insert without description
    INSERT INTO public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, status, featured, seller_id) 
    VALUES (13, 4, 1, 15, 73, 'Giulia', 2022, 77998.00, 'available', true, 1)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  -- More car inserts can be added here
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting car: %', SQLERRM;
END $$;

-- Insert statements for car_models (sample)
DO $$
BEGIN
  INSERT INTO public.car_models (id, name, brand_id) VALUES (1, 'A3', 8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.car_models (id, name, brand_id) VALUES (2, 'A4', 8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.car_models (id, name, brand_id) VALUES (3, 'A6', 8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.car_models (id, name, brand_id) VALUES (4, 'A8', 8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.car_models (id, name, brand_id) VALUES (5, 'Q3', 8) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.car_models (id, name, brand_id) VALUES (6, 'Q5', 8) ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting car_models: %', SQLERRM;
END $$;

-- Reset sequences
SELECT setval('public.brands_id_seq', (SELECT MAX(id) FROM public.brands), true);
SELECT setval('public.car_images_id_seq', COALESCE((SELECT MAX(id) FROM public.car_images), 0) + 1, false);
SELECT setval('public.car_models_id_seq', (SELECT MAX(id) FROM public.car_models), true);
SELECT setval('public.cars_id_seq', (SELECT MAX(id) FROM public.cars), true);
SELECT setval('public.categories_id_seq', (SELECT MAX(id) FROM public.categories), true);
SELECT setval('public.locations_id_seq', (SELECT MAX(id) FROM public.locations), true);
SELECT setval('public.specifications_id_seq', (SELECT MAX(id) FROM public.specifications), true);
SELECT setval('public.users_id_seq', (SELECT MAX(id) FROM public.users), true);
SELECT setval('public.wishlists_id_seq', COALESCE((SELECT MAX(id) FROM public.wishlists), 0) + 1, false);

-- Commit transaction
COMMIT;
