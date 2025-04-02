-- Full database setup for Render.com

-- Include the schema
\i schema.sql

-- Insert brands
INSERT INTO brands (name) VALUES 
('BMW'),
('Mercedes-Benz'),
('Audi'),
('Toyota'),
('Honda'),
('Ford'),
('Chevrolet'),
('Volkswagen'),
('Hyundai'),
('Kia');

-- Insert categories
INSERT INTO categories (name, type) VALUES 
('Sedan', 'car'),
('SUV', 'car'),
('Coupe', 'car'),
('Hatchback', 'car'),
('Truck', 'car'),
('Convertible', 'car'),
('Motorcycle', 'moto'),
('Scooter', 'moto'),
('Excavator', 'special_equipment'),
('Bulldozer', 'special_equipment');

-- Insert admin user
INSERT INTO users (username, email, password, role, first_name, last_name, age, gender, phone)
VALUES (
  'admin', 
  'admin@example.com', 
  '$2b$10$mLwxZgNhYQAXVV5K.Aw9qOJmRd9KvQvj4BWFHXSrWj2MgJTghymrG', -- password: admin123
  'admin',
  'Admin',
  'User',
  30,
  'male',
  '+995555123456'
);
