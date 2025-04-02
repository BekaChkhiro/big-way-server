-- Create admin user for testing purposes
-- Password will be 'admin123' (hashed)

-- First check if admin user already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@bigway.com') THEN
        -- Insert admin user with hashed password
        INSERT INTO users 
        (username, email, password, first_name, last_name, role)
        VALUES 
        ('admin', 'admin@bigway.com', 
         -- This is bcrypt hash for 'admin123'
         '$2a$10$rrCvTWRyXGP7tXkOSPvF8.ZY7BKr9GTZJj.JGZjVdPZ2c8VY6RFOm', 
         'Admin', 'User', 'admin');
        
        RAISE NOTICE 'Admin user created successfully';
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END
$$;
