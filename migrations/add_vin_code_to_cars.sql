-- Add VIN code field to cars table
ALTER TABLE public.cars ADD COLUMN vin_code VARCHAR(20);

-- Update the search vector to include VIN code in searches
DROP FUNCTION IF EXISTS public.cars_search_vector_update() CASCADE;

CREATE FUNCTION public.cars_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.vin_code, '')), 'A') ||
        setweight(to_tsvector('english', (
            SELECT string_agg(name, ' ')
            FROM brands
            WHERE id = NEW.brand_id
        )), 'A');
    RETURN NEW;
END;
$$;

-- Create or recreate trigger
DROP TRIGGER IF EXISTS cars_search_vector_update ON public.cars;

CREATE TRIGGER cars_search_vector_update
    BEFORE INSERT OR UPDATE ON public.cars
    FOR EACH ROW
    EXECUTE PROCEDURE public.cars_search_vector_update();
