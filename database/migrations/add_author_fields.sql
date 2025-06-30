-- Add author information fields to cars table
ALTER TABLE cars 
ADD COLUMN author_name VARCHAR(255),
ADD COLUMN author_phone VARCHAR(50);

-- Update existing records with seller information (optional)
-- Uncomment and run if you want to populate existing records
-- UPDATE cars c
-- SET author_name = CONCAT(u.first_name, ' ', u.last_name),
--     author_phone = u.phone
-- FROM users u
-- WHERE c.seller_id = u.id;
