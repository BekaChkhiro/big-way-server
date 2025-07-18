-- Add dealer role to user_role enum
ALTER TYPE public.user_role ADD VALUE 'dealer' AFTER 'user';

-- Create dealer_profiles table first
CREATE TABLE IF NOT EXISTS public.dealer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    established_year INTEGER,
    website_url VARCHAR(500),
    social_media_url VARCHAR(500),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dealer_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT check_established_year CHECK (established_year >= 1900 AND established_year <= EXTRACT(YEAR FROM CURRENT_DATE))
);

-- Add dealer_id field to users table for bidirectional relationship
ALTER TABLE public.users 
ADD COLUMN dealer_id INTEGER,
ADD CONSTRAINT fk_user_dealer FOREIGN KEY (dealer_id) REFERENCES public.dealer_profiles(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_dealer_profiles_user_id ON public.dealer_profiles(user_id);
CREATE INDEX idx_dealer_profiles_company_name ON public.dealer_profiles(company_name);
CREATE INDEX idx_users_dealer_id ON public.users(dealer_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dealer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dealer_profiles_updated_at_trigger
BEFORE UPDATE ON public.dealer_profiles
FOR EACH ROW
EXECUTE FUNCTION update_dealer_profiles_updated_at();

-- Function to automatically update dealer_id in users table when dealer_profile is created
CREATE OR REPLACE FUNCTION sync_user_dealer_id()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update users table with dealer_id when dealer profile is created
        UPDATE public.users 
        SET dealer_id = NEW.id 
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Clear dealer_id from users table when dealer profile is deleted
        UPDATE public.users 
        SET dealer_id = NULL 
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically sync dealer_id in users table
CREATE TRIGGER sync_user_dealer_id_trigger
AFTER INSERT OR DELETE ON public.dealer_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_dealer_id();