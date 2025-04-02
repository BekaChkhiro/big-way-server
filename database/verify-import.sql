-- Set client_min_messages to warning to reduce noise
SET client_min_messages TO warning;

-- Count records in each table
SELECT 'brands' as table_name, COUNT(*) as record_count FROM public.brands
UNION ALL
SELECT 'categories', COUNT(*) FROM public.categories
UNION ALL
SELECT 'locations', COUNT(*) FROM public.locations
UNION ALL
SELECT 'specifications', COUNT(*) FROM public.specifications
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
UNION ALL
SELECT 'cars', COUNT(*) FROM public.cars
UNION ALL
SELECT 'car_images', COUNT(*) FROM public.car_images
ORDER BY table_name;

-- Sample data from each table
SELECT 'BRANDS SAMPLE:' as info;
SELECT * FROM public.brands LIMIT 3;

SELECT 'CATEGORIES SAMPLE:' as info;
SELECT * FROM public.categories LIMIT 3;

SELECT 'LOCATIONS SAMPLE:' as info;
SELECT * FROM public.locations LIMIT 3;

SELECT 'SPECIFICATIONS SAMPLE:' as info;
SELECT * FROM public.specifications LIMIT 3;

SELECT 'USERS SAMPLE:' as info;
SELECT * FROM public.users LIMIT 2;

SELECT 'CARS SAMPLE:' as info;
SELECT * FROM public.cars LIMIT 3;

SELECT 'CAR_IMAGES SAMPLE:' as info;
SELECT * FROM public.car_images LIMIT 3;

-- Check sequence values
SELECT 'SEQUENCE VALUES:' as info;
SELECT 'brands_id_seq' as sequence_name, last_value FROM public.brands_id_seq
UNION ALL
SELECT 'categories_id_seq', last_value FROM public.categories_id_seq
UNION ALL
SELECT 'locations_id_seq', last_value FROM public.locations_id_seq
UNION ALL
SELECT 'specifications_id_seq', last_value FROM public.specifications_id_seq
UNION ALL
SELECT 'users_id_seq', last_value FROM public.users_id_seq
UNION ALL
SELECT 'cars_id_seq', last_value FROM public.cars_id_seq
UNION ALL
SELECT 'car_images_id_seq', last_value FROM public.car_images_id_seq
ORDER BY sequence_name;
