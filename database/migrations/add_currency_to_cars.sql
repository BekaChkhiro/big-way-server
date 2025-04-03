-- Add currency column to cars table with default value 'GEL'
ALTER TABLE public.cars ADD COLUMN currency character varying(10) DEFAULT 'GEL'::character varying NOT NULL;

-- Update existing records to have 'GEL' as currency
UPDATE public.cars SET currency = 'GEL' WHERE currency IS NULL;
