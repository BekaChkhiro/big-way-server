-- Migration to fix conflicting constraints on the steering_wheel column
-- First, drop the Georgian constraint
ALTER TABLE specifications DROP CONSTRAINT IF EXISTS valid_steering_wheel;

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

-- Comment explaining the changes
COMMENT ON COLUMN specifications.steering_wheel IS 'Driver steering wheel position, valid values are "left" and "right" (English only)';
