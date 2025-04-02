-- Verify final import status
SET client_min_messages TO warning;

-- Count records in each table
SELECT
    table_name,
    (SELECT COUNT(*) FROM public.locations WHERE table_name = 'locations') AS location_count,
    (SELECT COUNT(*) FROM public.specifications WHERE table_name = 'specifications') AS specification_count,
    (SELECT COUNT(*) FROM public.cars WHERE table_name = 'cars') AS car_count,
    (SELECT COUNT(*) FROM public.car_images WHERE table_name = 'car_images') AS car_image_count
FROM (
    VALUES ('locations'), ('specifications'), ('cars'), ('car_images')
) AS t(table_name);

-- Sample data from each table
\echo '=== LOCATIONS SAMPLE ==='
SELECT * FROM public.locations LIMIT 3;

\echo '=== SPECIFICATIONS SAMPLE ==='
SELECT id, created_at FROM public.specifications LIMIT 3;

\echo '=== CARS SAMPLE ==='
SELECT id, brand_id, model, year, price, status, featured, seller_id, created_at FROM public.cars LIMIT 3;

\echo '=== CAR_IMAGES SAMPLE ==='
SELECT id, car_id, image_url, thumbnail_url, is_primary, created_at FROM public.car_images LIMIT 3;

-- Check sequence values
\echo '=== SEQUENCE VALUES ==='
SELECT 
    sequence_name, 
    last_value
FROM 
    pg_sequences
WHERE 
    schemaname = 'public'
ORDER BY 
    sequence_name;
