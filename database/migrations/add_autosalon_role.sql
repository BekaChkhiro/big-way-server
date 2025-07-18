-- Add autosalon role to user_role enum
-- Note: PostgreSQL doesn't allow ALTER TYPE ADD VALUE inside a transaction block,
-- so this migration must be run separately

DO $$ 
BEGIN
    -- Check if 'autosalon' value already exists in the enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'autosalon' 
        AND enumtypid = (
            SELECT oid 
            FROM pg_type 
            WHERE typname = 'user_role'
        )
    ) THEN
        -- Add the new value to the enum
        ALTER TYPE public.user_role ADD VALUE 'autosalon' AFTER 'dealer';
    END IF;
END $$;

-- Add trigger to update updated_at timestamp for autosalon_profiles (if not exists)
CREATE OR REPLACE FUNCTION update_autosalon_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_autosalon_profiles_updated_at_trigger'
    ) THEN
        CREATE TRIGGER update_autosalon_profiles_updated_at_trigger
        BEFORE UPDATE ON public.autosalon_profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_autosalon_profiles_updated_at();
    END IF;
END $$;