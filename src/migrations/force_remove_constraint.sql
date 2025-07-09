-- Forcefully remove the Georgian steering wheel constraint
ALTER TABLE IF EXISTS specifications DROP CONSTRAINT IF EXISTS valid_steering_wheel;

-- Double check if there are any constraints with similar names and remove them
DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'specifications'
        AND tc.constraint_name LIKE '%steering_wheel%'
        AND tc.constraint_name != 'specifications_steering_wheel_check'
    LOOP
        EXECUTE 'ALTER TABLE specifications DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Make sure the English constraint is properly applied
ALTER TABLE specifications DROP CONSTRAINT IF EXISTS specifications_steering_wheel_check;
ALTER TABLE specifications ADD CONSTRAINT specifications_steering_wheel_check 
  CHECK (steering_wheel IS NULL OR steering_wheel::text = ANY (ARRAY['left'::character varying, 'right'::character varying]::text[]));

-- Update any existing records with Georgian values to their English equivalents
UPDATE specifications
SET steering_wheel = 'left'
WHERE steering_wheel = 'მარცხენა';

UPDATE specifications
SET steering_wheel = 'right'
WHERE steering_wheel = 'მარჯვენა';
