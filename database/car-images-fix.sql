-- Car images fix script for Render.com database
-- Set client_min_messages to warning to reduce noise
SET client_min_messages TO warning;

-- Start transaction
BEGIN;

-- First, check the car_images table structure
\echo '=== CHECKING CAR_IMAGES TABLE STRUCTURE ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'car_images'
ORDER BY ordinal_position;

-- Insert car images with all required fields
DO $$
DECLARE
    has_image_url boolean := false;
    has_url boolean := false;
    has_thumbnail_url boolean := false;
    has_medium_url boolean := false;
    has_large_url boolean := false;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_images' 
        AND column_name = 'image_url'
    ) INTO has_image_url;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_images' 
        AND column_name = 'url'
    ) INTO has_url;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_images' 
        AND column_name = 'thumbnail_url'
    ) INTO has_thumbnail_url;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_images' 
        AND column_name = 'medium_url'
    ) INTO has_medium_url;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_images' 
        AND column_name = 'large_url'
    ) INTO has_large_url;
    
    -- Log which columns we found
    RAISE NOTICE 'Found columns: image_url=%, url=%, thumbnail_url=%, medium_url=%, large_url=%', 
        has_image_url, has_url, has_thumbnail_url, has_medium_url, has_large_url;
    
    -- Insert car images with all required fields
    IF has_image_url AND has_thumbnail_url THEN
        -- Use image_url column with thumbnail_url
        INSERT INTO public.car_images (
            id, car_id, image_url, 
            thumbnail_url, 
            medium_url, 
            large_url, 
            is_primary
        )
        SELECT 
            1, 1, 'https://example.com/images/bmw_1.jpg', 
            'https://example.com/images/thumbnails/bmw_1.jpg', 
            CASE WHEN has_medium_url THEN 'https://example.com/images/medium/bmw_1.jpg' ELSE NULL END, 
            CASE WHEN has_large_url THEN 'https://example.com/images/large/bmw_1.jpg' ELSE NULL END, 
            true
        WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 1)
          AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 1);
        
        INSERT INTO public.car_images (
            id, car_id, image_url, 
            thumbnail_url, 
            medium_url, 
            large_url, 
            is_primary
        )
        SELECT 
            2, 1, 'https://example.com/images/bmw_2.jpg', 
            'https://example.com/images/thumbnails/bmw_2.jpg', 
            CASE WHEN has_medium_url THEN 'https://example.com/images/medium/bmw_2.jpg' ELSE NULL END, 
            CASE WHEN has_large_url THEN 'https://example.com/images/large/bmw_2.jpg' ELSE NULL END, 
            false
        WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 1)
          AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 2);
        
        RAISE NOTICE 'Inserted car images using image_url and thumbnail_url columns';
    ELSIF has_url AND has_thumbnail_url THEN
        -- Use url column with thumbnail_url
        INSERT INTO public.car_images (
            id, car_id, url, 
            thumbnail_url, 
            medium_url, 
            large_url, 
            is_primary
        )
        SELECT 
            1, 1, 'https://example.com/images/bmw_1.jpg', 
            'https://example.com/images/thumbnails/bmw_1.jpg', 
            CASE WHEN has_medium_url THEN 'https://example.com/images/medium/bmw_1.jpg' ELSE NULL END, 
            CASE WHEN has_large_url THEN 'https://example.com/images/large/bmw_1.jpg' ELSE NULL END, 
            true
        WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 1)
          AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 1);
        
        INSERT INTO public.car_images (
            id, car_id, url, 
            thumbnail_url, 
            medium_url, 
            large_url, 
            is_primary
        )
        SELECT 
            2, 1, 'https://example.com/images/bmw_2.jpg', 
            'https://example.com/images/thumbnails/bmw_2.jpg', 
            CASE WHEN has_medium_url THEN 'https://example.com/images/medium/bmw_2.jpg' ELSE NULL END, 
            CASE WHEN has_large_url THEN 'https://example.com/images/large/bmw_2.jpg' ELSE NULL END, 
            false
        WHERE EXISTS (SELECT 1 FROM public.cars WHERE id = 1)
          AND NOT EXISTS (SELECT 1 FROM public.car_images WHERE id = 2);
        
        RAISE NOTICE 'Inserted car images using url and thumbnail_url columns';
    ELSE
        RAISE NOTICE 'Could not insert car images due to missing required columns';
    END IF;
END $$;

-- Reset sequence
SELECT setval('public.car_images_id_seq', COALESCE((SELECT MAX(id) FROM public.car_images), 0) + 1, false);

-- Show what we've inserted
\echo '=== CAR_IMAGES AFTER INSERT ==='
SELECT * FROM public.car_images;

-- Commit transaction
COMMIT;
