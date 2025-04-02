-- სკრიპტი, რომელიც წაშლის ტრიგერს და შემდეგ ჩასვამს მონაცემებს
SET client_min_messages TO warning;

-- პირველ რიგში, მოვძებნოთ და წავშალოთ search_vector ტრიგერი
DO $$
DECLARE
    trigger_name text;
BEGIN
    -- ვპოულობთ ტრიგერის სახელს
    SELECT tgname INTO trigger_name
    FROM pg_trigger
    WHERE tgrelid = 'public.cars'::regclass
    AND tgname LIKE '%search_vector%';
    
    -- თუ ვიპოვეთ, ვშლით
    IF trigger_name IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER ' || trigger_name || ' ON public.cars';
        RAISE NOTICE 'წაიშალა ტრიგერი: %', trigger_name;
    ELSE
        RAISE NOTICE 'ვერ ვიპოვეთ search_vector ტრიგერი cars ცხრილზე';
    END IF;
END $$;

-- ჩასმა locations ცხრილში
BEGIN;
INSERT INTO public.locations (id, city, location_type, is_transit, state, country)
SELECT 1, 'თბილისი', 'transit', false, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = 1);
COMMIT;

-- ჩასმა specifications ცხრილში
BEGIN;
INSERT INTO public.specifications (id)
SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM public.specifications WHERE id = 1);
COMMIT;

-- ჩასმა cars ცხრილში
BEGIN;
INSERT INTO public.cars (
    id, brand_id, category_id, location_id, specification_id, 
    model, year, price, status, featured, seller_id
)
SELECT 
    1, 1, 1, 1, 1, 'X5', 2022, 75000.00, 'available', true, 1
WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM public.cars WHERE id = 1);
COMMIT;

-- ჩასმა car_images ცხრილში
BEGIN;
INSERT INTO public.car_images (
    id, car_id, image_url, thumbnail_url, medium_url, large_url, is_primary
)
SELECT 
    1, 1, 
    'https://example.com/images/bmw_1.jpg',
    'https://example.com/images/thumbnails/bmw_1.jpg',
    'https://example.com/images/medium/bmw_1.jpg',
    'https://example.com/images/large/bmw_1.jpg',
    true
WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 1);
COMMIT;

-- მარტივი შემოწმება
SELECT 'RECORD COUNTS' AS info;
SELECT 'locations' AS table_name, COUNT(*) AS count FROM public.locations
UNION ALL
SELECT 'specifications', COUNT(*) FROM public.specifications
UNION ALL
SELECT 'cars', COUNT(*) FROM public.cars
UNION ALL
SELECT 'car_images', COUNT(*) FROM public.car_images
ORDER BY table_name;
