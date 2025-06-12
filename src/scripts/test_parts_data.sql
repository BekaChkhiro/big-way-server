-- Test data for parts table
-- Run this script to populate the database with test car parts

-- Insert test car parts with various brands, categories and conditions
INSERT INTO parts (
  title,
  category_id,
  brand_id,
  model_id,
  condition,
  price,
  description,
  description_en,
  description_ka,
  seller_id,
  created_at
) VALUES 
-- BMW Parts
('BMW M3 Front Bumper - Carbon Fiber', 
  (SELECT id FROM categories WHERE name = 'Body Parts' OR name = 'Exterior' LIMIT 1),
  (SELECT id FROM brands WHERE name = 'BMW' LIMIT 1),
  (SELECT id FROM car_models WHERE name = 'M3' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW' LIMIT 1) LIMIT 1),
  'new',
  2500.00,
  'Original BMW M3 Carbon Fiber Front Bumper - Perfect condition, never installed',
  'Original BMW M3 Carbon Fiber Front Bumper - Perfect condition, never installed',
  'BMW M3-ის კარბონის წინა ბამპერი - იდეალურ მდგომარეობაში, არასოდეს დამონტაჟებული',
  (SELECT id FROM users LIMIT 1),
  NOW()
),

('BMW 5 Series E60 Headlight Assembly - Right', 
  (SELECT id FROM categories WHERE name = 'Lighting' OR name = 'Exterior' LIMIT 1),
  (SELECT id FROM brands WHERE name = 'BMW' LIMIT 1),
  (SELECT id FROM car_models WHERE name = '5 Series' AND brand_id = (SELECT id FROM brands WHERE name = 'BMW' LIMIT 1) LIMIT 1),
  'used',
  350.00,
  'Used BMW E60 headlight assembly in good working condition - slight scratches on lens',
  'Used BMW E60 headlight assembly in good working condition - slight scratches on lens',
  'BMW E60-ის ფარები კარგ მდგომარეობაში - მცირე ნაკაწრებით ლინზაზე',
  (SELECT id FROM users LIMIT 1),
  NOW() - INTERVAL '3 days'
),

-- Mercedes Parts
('Mercedes-Benz AMG GT Exhaust System - Complete', 
  (SELECT id FROM categories WHERE name = 'Exhaust' OR name = 'Performance' LIMIT 1),
  (SELECT id FROM brands WHERE name = 'Mercedes-Benz' LIMIT 1),
  (SELECT id FROM car_models WHERE name = 'AMG GT' AND brand_id = (SELECT id FROM brands WHERE name = 'Mercedes-Benz' LIMIT 1) LIMIT 1),
  'new',
  3200.00,
  'Complete aftermarket exhaust system for Mercedes AMG GT - Stainless steel construction with carbon fiber tips',
  'Complete aftermarket exhaust system for Mercedes AMG GT - Stainless steel construction with carbon fiber tips',
  'Mercedes AMG GT-ისთვის აფტერმარკეტ გამონაბოლქვის სისტემა - უჟანგავი ფოლადის კონსტრუქცია კარბონის ბოლოებით',
  (SELECT id FROM users OFFSET 1 LIMIT 1),
  NOW() - INTERVAL '1 week'
),

-- Toyota Parts
('Toyota Land Cruiser Brake Kit - Front and Rear', 
  (SELECT id FROM categories WHERE name = 'Brakes' OR name = 'Suspension' LIMIT 1),
  (SELECT id FROM brands WHERE name = 'Toyota' LIMIT 1),
  (SELECT id FROM car_models WHERE name = 'Land Cruiser' AND brand_id = (SELECT id FROM brands WHERE name = 'Toyota' LIMIT 1) LIMIT 1),
  'new',
  850.00,
  'Heavy-duty brake kit for Toyota Land Cruiser - Includes front and rear rotors, pads, and hardware',
  'Heavy-duty brake kit for Toyota Land Cruiser - Includes front and rear rotors, pads, and hardware',
  'Toyota Land Cruiser-ისთვის სამუხრუჭე კომპლექტი - შეიცავს წინა და უკანა დისკებს, ხუნდებს და აქსესუარებს',
  (SELECT id FROM users OFFSET 2 LIMIT 1),
  NOW() - INTERVAL '5 days'
),

-- Audi Parts
('Audi A4 Turbocharger - Reconditioned', 
  (SELECT id FROM categories WHERE name = 'Engine' OR name = 'Performance' LIMIT 1),
  (SELECT id FROM brands WHERE name = 'Audi' LIMIT 1),
  (SELECT id FROM car_models WHERE name = 'A4' AND brand_id = (SELECT id FROM brands WHERE name = 'Audi' LIMIT 1) LIMIT 1),
  'used',
  600.00,
  'Reconditioned turbocharger for Audi A4 2.0T - Professionally rebuilt with new bearings and balanced',
  'Reconditioned turbocharger for Audi A4 2.0T - Professionally rebuilt with new bearings and balanced',
  'აუდი A4 2.0T-სთვის აღდგენილი ტურბო - პროფესიონალურად აღდგენილი ახალი საკისრებით და დაბალანსებული',
  (SELECT id FROM users OFFSET 1 LIMIT 1),
  NOW() - INTERVAL '2 weeks'
),

-- Ford Parts
('Ford Mustang GT Performance Intake Manifold', 
  (SELECT id FROM categories WHERE name = 'Engine' OR name = 'Performance' LIMIT 1),
  (SELECT id FROM brands WHERE name = 'Ford' LIMIT 1),
  (SELECT id FROM car_models WHERE name = 'Mustang' AND brand_id = (SELECT id FROM brands WHERE name = 'Ford' LIMIT 1) LIMIT 1),
  'new',
  750.00,
  'High-flow intake manifold for Ford Mustang GT - Increases horsepower and torque throughout the power band',
  'High-flow intake manifold for Ford Mustang GT - Increases horsepower and torque throughout the power band',
  'Ford Mustang GT-სთვის მაღალი გამტარობის შემწოვი კოლექტორი - ზრდის სიმძლავრეს და გადაცემას მთელი დიაპაზონის განმავლობაში',
  (SELECT id FROM users LIMIT 1),
  NOW() - INTERVAL '1 day'
);

-- Note: You would normally include image references here, but since images require file uploads
-- they should be added through the application's file upload functionality
