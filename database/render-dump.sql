-- Create custom enum type for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Drop existing gender type if exists and recreate
DROP TYPE IF EXISTS user_gender CASCADE;
CREATE TYPE user_gender AS ENUM ('male', 'female');

-- Create custom enum type for vehicle types
DROP TYPE IF EXISTS vehicle_type CASCADE;
CREATE TYPE vehicle_type AS ENUM ('car', 'special_equipment', 'moto');

-- Create custom enum for fuel types
DROP TYPE IF EXISTS fuel_type CASCADE;
CREATE TYPE fuel_type AS ENUM (
    'ბენზინი',
    'დიზელი', 
    'ელექტრო',
    'ჰიბრიდი',
    'დატენვადი_ჰიბრიდი',
    'თხევადი_გაზი',
    'ბუნებრივი_გაზი',
    'წყალბადი'
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    age INTEGER NOT NULL,
    gender user_gender NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type vehicle_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, type)
);

-- Enums for location types
DROP TYPE IF EXISTS location_type CASCADE;
CREATE TYPE location_type AS ENUM ('transit', 'georgia', 'international');

-- Locations table
DROP TABLE IF EXISTS locations CASCADE;
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    location_type location_type NOT NULL,
    is_transit BOOLEAN DEFAULT false,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Add a check constraint to ensure state and country are NULL for Georgian cities
    CONSTRAINT location_type_check CHECK (
        (location_type = 'georgia' AND state IS NULL AND country IS NULL) OR
        (location_type = 'international' AND state IS NOT NULL AND country IS NOT NULL) OR
        (location_type = 'transit' AND state IS NULL AND country IS NULL)
    )
);

-- Add index for faster location searches
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_type ON locations(location_type);

-- Create enum for clearance status
DROP TYPE IF EXISTS clearance_status CASCADE;
CREATE TYPE clearance_status AS ENUM ('cleared', 'not_cleared', 'in_progress');

-- Car specifications table
DROP TABLE IF EXISTS specifications CASCADE;
CREATE TABLE IF NOT EXISTS specifications (
    id SERIAL PRIMARY KEY,
    engine_type VARCHAR(50),
    transmission VARCHAR(50) CHECK (transmission IN ('manual', 'automatic', 'tiptronic', 'variator')),
    fuel_type fuel_type,
    mileage INTEGER,
    mileage_unit VARCHAR(2) CHECK (mileage_unit IN ('km', 'mi')),
    engine_size DECIMAL(3,1),
    horsepower INTEGER,
    doors INTEGER CHECK (doors IN (2, 3, 4, 5, 6, 7, 8)),
    is_turbo BOOLEAN DEFAULT false,
    cylinders INTEGER,
    manufacture_month INTEGER CHECK (manufacture_month BETWEEN 1 AND 12),
    body_type VARCHAR(50),
    steering_wheel VARCHAR(10) CHECK (steering_wheel IN ('left', 'right')),
    drive_type VARCHAR(10) CHECK (drive_type IN ('front', 'rear', '4x4')),
    clearance_status clearance_status DEFAULT 'not_cleared',
    has_catalyst BOOLEAN DEFAULT true,
    airbags_count INTEGER CHECK (airbags_count BETWEEN 0 AND 12),
    interior_material VARCHAR(50) CHECK (interior_material IN ('ნაჭერი', 'ტყავი', 'ხელოვნური ტყავი', 'კომბინირებული', 'ალკანტარა')),
    interior_color VARCHAR(50),
    -- Features
    has_hydraulics BOOLEAN DEFAULT false,
    has_board_computer BOOLEAN DEFAULT false,
    has_air_conditioning BOOLEAN DEFAULT false,
    has_parking_control BOOLEAN DEFAULT false,
    has_rear_view_camera BOOLEAN DEFAULT false,
    has_electric_windows BOOLEAN DEFAULT false,
    has_climate_control BOOLEAN DEFAULT false,
    has_cruise_control BOOLEAN DEFAULT false,
    has_start_stop BOOLEAN DEFAULT false,
    has_sunroof BOOLEAN DEFAULT false,
    has_seat_heating BOOLEAN DEFAULT false,
    has_seat_memory BOOLEAN DEFAULT false,
    has_abs BOOLEAN DEFAULT false,
    has_traction_control BOOLEAN DEFAULT false,
    has_central_locking BOOLEAN DEFAULT false,
    has_alarm BOOLEAN DEFAULT false,
    has_fog_lights BOOLEAN DEFAULT false,
    has_navigation BOOLEAN DEFAULT false,
    has_aux BOOLEAN DEFAULT false,
    has_bluetooth BOOLEAN DEFAULT false,
    has_multifunction_steering_wheel BOOLEAN DEFAULT false,
    has_alloy_wheels BOOLEAN DEFAULT false,
    has_spare_tire BOOLEAN DEFAULT false,
    is_disability_adapted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cars table (enhanced)
CREATE TABLE IF NOT EXISTS cars (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    specification_id INTEGER REFERENCES specifications(id) ON DELETE SET NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1900 AND EXTRACT(YEAR FROM NOW() + INTERVAL '1 year')),
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    description_en TEXT,
    description_ka TEXT,
    description_ru TEXT,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'pending')),
    featured BOOLEAN DEFAULT false,
    seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    search_vector tsvector
);

-- Add indexes for frequently queried columns
CREATE INDEX idx_cars_brand_id ON cars(brand_id);
CREATE INDEX idx_cars_category_id ON cars(category_id);
CREATE INDEX idx_cars_year ON cars(year);
CREATE INDEX idx_cars_price ON cars(price);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_featured ON cars(featured);

-- Add GiST index for price range queries
CREATE INDEX idx_cars_price_range ON cars USING gist (
    box(point(price, -1), point(price, 1))
);

-- Add full-text search capabilities
CREATE INDEX cars_search_idx ON cars USING GIN (search_vector);

-- Create trigger to automatically update search vector
CREATE OR REPLACE FUNCTION cars_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', (
            SELECT string_agg(name, ' ')
            FROM brands
            WHERE id = NEW.brand_id
        )), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cars_search_vector_update
    BEFORE INSERT OR UPDATE ON cars
    FOR EACH ROW
    EXECUTE FUNCTION cars_search_vector_update();

-- Update car_images table
DROP TABLE IF EXISTS car_images CASCADE;
CREATE TABLE IF NOT EXISTS car_images (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    medium_url TEXT NOT NULL,
    large_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, car_id)
);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to cars table
CREATE TRIGGER update_cars_updated_at
    BEFORE UPDATE ON cars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();