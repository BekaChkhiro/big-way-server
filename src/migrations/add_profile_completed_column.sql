-- Add profile_completed column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Update existing users to have profile_completed = true, assuming existing users have complete profiles
UPDATE users SET profile_completed = true WHERE profile_completed IS NULL;
