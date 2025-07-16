--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Ubuntu 16.8-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.8 (Ubuntu 16.8-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: clearance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.clearance_status AS ENUM (
    'cleared',
    'not_cleared',
    'in_progress'
);


--
-- Name: user_gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_gender AS ENUM (
    'male',
    'female'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin'
);


--
-- Name: cars_search_vector_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cars_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: populate_models_for_all_brands(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.populate_models_for_all_brands() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    brand_rec RECORD;
    brand_models TEXT[];
    model_name TEXT;
    model_exists BOOLEAN;
    brand_count INT := 0;
    model_count INT := 0;
BEGIN
    -- Define a mapping of brand names to models
    -- This uses the same comprehensive list we added to the server code
    CREATE TEMP TABLE IF NOT EXISTS brand_model_mapping (
        brand_name TEXT,
        models TEXT[]
    );
    
    -- Clear any existing temp data
    DELETE FROM brand_model_mapping;
    
    -- Insert mappings
    INSERT INTO brand_model_mapping VALUES
    ('toyota', ARRAY['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Prius', 'Highlander', 'Avalon', '4Runner', 'Tacoma', 'Tundra']),
    ('honda', ARRAY['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Odyssey', 'Ridgeline', 'Passport', 'Insight']),
    ('ford', ARRAY['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Ranger', 'Bronco', 'Expedition', 'Focus']),
    ('chevrolet', ARRAY['Silverado', 'Equinox', 'Tahoe', 'Traverse', 'Malibu', 'Camaro', 'Suburban', 'Colorado', 'Blazer']),
    ('bmw', ARRAY['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'M3', 'M5', 'i4', 'iX']),
    ('mercedes', ARRAY['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'A-Class', 'CLA', 'AMG GT']),
    ('audi', ARRAY['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'e-tron', 'RS6', 'TT']),
    ('volkswagen', ARRAY['Golf', 'Passat', 'Tiguan', 'Atlas', 'Jetta', 'Arteon', 'ID.4', 'Taos', 'GTI']),
    ('hyundai', ARRAY['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Venue', 'Ioniq']),
    ('kia', ARRAY['Forte', 'K5', 'Sportage', 'Telluride', 'Sorento', 'Soul', 'Seltos', 'Carnival', 'Stinger']),
    ('nissan', ARRAY['Altima', 'Maxima', 'Sentra', 'Rogue', 'Pathfinder', 'Murano', 'Kicks', 'Armada', 'Titan', '370Z']),
    ('subaru', ARRAY['Outback', 'Forester', 'Crosstrek', 'Impreza', 'Legacy', 'Ascent', 'WRX', 'BRZ']),
    ('mazda', ARRAY['Mazda3', 'Mazda6', 'CX-5', 'CX-9', 'CX-30', 'MX-5 Miata', 'CX-3', 'CX-50']),
    ('lexus', ARRAY['ES', 'LS', 'RX', 'NX', 'UX', 'IS', 'GX', 'LX', 'RC', 'LC']),
    ('acura', ARRAY['MDX', 'RDX', 'TLX', 'ILX', 'NSX', 'RLX', 'TL', 'TSX']),
    ('infiniti', ARRAY['Q50', 'Q60', 'QX50', 'QX60', 'QX80', 'QX55', 'QX30']),
    ('porsche', ARRAY['911', 'Cayenne', 'Panamera', 'Macan', 'Taycan', 'Cayman', 'Boxster']),
    ('jaguar', ARRAY['F-PACE', 'E-PACE', 'I-PACE', 'XE', 'XF', 'XJ', 'F-TYPE']),
    ('land rover', ARRAY['Range Rover', 'Range Rover Sport', 'Discovery', 'Defender', 'Evoque', 'Velar']),
    ('bentley', ARRAY['Continental GT', 'Bentayga', 'Flying Spur', 'Mulsanne', 'Bacalar']),
    ('rolls royce', ARRAY['Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan']),
    ('ferrari', ARRAY['Roma', 'Portofino', 'SF90 Stradale', 'F8 Tributo', '812 Superfast']),
    ('lamborghini', ARRAY['Aventador', 'Huracán', 'Urus']),
    ('maserati', ARRAY['Ghibli', 'Levante', 'Quattroporte', 'MC20', 'GranTurismo']),
    ('bugatti', ARRAY['Chiron', 'Veyron', 'Divo', 'Centodieci']),
    ('aston martin', ARRAY['DB11', 'Vantage', 'DBS Superleggera', 'DBX']),
    ('tesla', ARRAY['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck']),
    ('volvo', ARRAY['XC90', 'XC60', 'XC40', 'S60', 'S90', 'V60', 'V90']),
    ('alfa romeo', ARRAY['Giulia', 'Stelvio', '4C', 'Giulietta', 'Tonale']),
    ('chrysler', ARRAY['300', 'Pacifica', 'Voyager', 'Town & Country']),
    ('dodge', ARRAY['Challenger', 'Charger', 'Durango', 'Journey', 'Grand Caravan']),
    ('jeep', ARRAY['Grand Cherokee', 'Cherokee', 'Wrangler', 'Compass', 'Renegade', 'Gladiator']),
    ('ram', ARRAY['1500', '2500', '3500', 'ProMaster', 'ProMaster City']),
    ('fiat', ARRAY['500', '500X', '500L', '124 Spider']),
    ('mini', ARRAY['Cooper', 'Countryman', 'Clubman', 'Convertible', 'Electric']),
    ('buick', ARRAY['Enclave', 'Encore', 'Envision', 'LaCrosse', 'Regal']),
    ('cadillac', ARRAY['Escalade', 'CT4', 'CT5', 'XT4', 'XT5', 'XT6']),
    ('gmc', ARRAY['Sierra', 'Yukon', 'Acadia', 'Terrain', 'Canyon']),
    ('lincoln', ARRAY['Navigator', 'Aviator', 'Nautilus', 'Corsair', 'Continental']),
    ('mitsubishi', ARRAY['Outlander', 'Eclipse Cross', 'Mirage', 'Outlander Sport']),
    ('suzuki', ARRAY['Swift', 'Vitara', 'Jimny', 'S-Cross', 'Ignis']),
    ('genesis', ARRAY['G70', 'G80', 'G90', 'GV70', 'GV80']),
    ('polestar', ARRAY['Polestar 1', 'Polestar 2', 'Polestar 3']),
    ('rivian', ARRAY['R1T', 'R1S']),
    ('lucid', ARRAY['Air']),
    ('fisker', ARRAY['Ocean', 'Karma']);

    -- Loop through each brand in the database
    FOR brand_rec IN SELECT id, name FROM brands ORDER BY name LOOP
        brand_count := brand_count + 1;
        
        -- Check if this brand already has models
        PERFORM 1 FROM models WHERE brand_id = brand_rec.id LIMIT 1;
        
        IF FOUND THEN
            RAISE NOTICE 'Brand % (ID: %) already has models, skipping', brand_rec.name, brand_rec.id;
            CONTINUE;
        END IF;
        
        -- Try to find a matching model list
        Models INTO brand_models 
        FROM brand_model_mapping 
        WHERE LOWER(brand_name) = LOWER(brand_rec.name);
        
        -- If no direct match, try fuzzy match
        IF brand_models IS NULL THEN
            Models INTO brand_models 
            FROM brand_model_mapping 
            WHERE 
                LOWER(brand_rec.name) LIKE '%' || LOWER(brand_name) || '%' OR 
                LOWER(brand_name) LIKE '%' || LOWER(brand_rec.name) || '%'
            ORDER BY LENGTH(brand_name) DESC
            LIMIT 1;
        END IF;
        
        -- If still no match, use a generic model list
        IF brand_models IS NULL THEN
            brand_models := ARRAY['Model 1', 'Model 2', 'Model 3', 'Premium', 'Sport', 'Luxury', 'Standard'];
        END IF;
        
        -- Insert models for this brand
        FOREACH model_name IN ARRAY brand_models LOOP
            -- Check if this exact model already exists
            SELECT EXISTS(
                SELECT 1 FROM models 
                WHERE brand_id = brand_rec.id AND name = model_name
            ) INTO model_exists;
            
            IF NOT model_exists THEN
                INSERT INTO models (name, brand_id) VALUES (model_name, brand_rec.id);
                model_count := model_count + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Processed % brands and added % models', brand_count, model_count;
    
    -- Clean up temp table
    DROP TABLE IF EXISTS brand_model_mapping;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: backup_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_categories (
    id integer,
    name character varying(100),
    created_at timestamp without time zone
);


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- Name: car_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_images (
    id integer NOT NULL,
    car_id integer,
    image_url text NOT NULL,
    thumbnail_url text NOT NULL,
    medium_url text NOT NULL,
    large_url text NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: car_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_images_id_seq OWNED BY public.car_images.id;


--
-- Name: car_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_models (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    brand_id integer
);


--
-- Name: car_models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_models_id_seq OWNED BY public.car_models.id;


--
-- Name: cars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cars (
    id integer NOT NULL,
    brand_id integer,
    category_id integer,
    location_id integer,
    specification_id integer,
    model character varying(100) NOT NULL,
    year integer NOT NULL,
    price numeric(10,2) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'available'::character varying,
    featured boolean DEFAULT false,
    seller_id integer,
    views_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    search_vector tsvector,
    description_ka text,
    description_en text,
    description_ru text
);


--
-- Name: cars_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cars_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cars_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cars_id_seq OWNED BY public.cars.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: door_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.door_counts (
    id integer NOT NULL,
    value character varying(255) NOT NULL
);


--
-- Name: door_counts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.door_counts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: door_counts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.door_counts_id_seq OWNED BY public.door_counts.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    country character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_in_transit boolean DEFAULT false,
    location_type character varying(255),
    CONSTRAINT locations_location_type_check CHECK (((location_type)::text = ANY ((ARRAY['city'::character varying, 'country'::character varying, 'special'::character varying, 'transit'::character varying])::text[])))
);


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.models (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    brand_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.models_id_seq OWNED BY public.models.id;


--
-- Name: specifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specifications (
    id integer NOT NULL,
    engine_type character varying(50),
    transmission character varying(50),
    fuel_type character varying(50),
    mileage integer,
    mileage_unit character varying(2),
    engine_size numeric(4,2),
    horsepower integer,
    is_turbo boolean DEFAULT false,
    cylinders integer,
    manufacture_month integer,
    color character varying(50),
    body_type character varying(50),
    steering_wheel character varying(10),
    drive_type character varying(10),
    has_catalyst boolean DEFAULT true,
    airbags_count integer,
    interior_material character varying(50),
    interior_color character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    doors character varying(255),
    has_hydraulics boolean DEFAULT false,
    has_board_computer boolean DEFAULT false,
    has_air_conditioning boolean DEFAULT false,
    has_parking_control boolean DEFAULT false,
    has_rear_view_camera boolean DEFAULT false,
    has_electric_windows boolean DEFAULT false,
    has_climate_control boolean DEFAULT false,
    has_cruise_control boolean DEFAULT false,
    has_start_stop boolean DEFAULT false,
    has_sunroof boolean DEFAULT false,
    has_heated_seats boolean DEFAULT false,
    has_seat_memory boolean DEFAULT false,
    has_abs boolean DEFAULT false,
    has_traction_control boolean DEFAULT false,
    has_central_locking boolean DEFAULT false,
    has_alarm boolean DEFAULT false,
    has_fog_lights boolean DEFAULT false,
    has_navigation boolean DEFAULT false,
    has_aux boolean DEFAULT false,
    has_bluetooth boolean DEFAULT false,
    has_multifunction_steering_wheel boolean DEFAULT false,
    has_alloy_wheels boolean DEFAULT false,
    has_spare_tire boolean DEFAULT false,
    is_disability_adapted boolean DEFAULT false,
    is_cleared boolean DEFAULT false,
    has_technical_inspection boolean DEFAULT false,
    clearance_status public.clearance_status DEFAULT 'not_cleared'::public.clearance_status,
    CONSTRAINT specifications_airbags_count_check CHECK (((airbags_count >= 0) AND (airbags_count <= 12))),
    CONSTRAINT specifications_drive_type_check CHECK (((drive_type)::text = ANY ((ARRAY['front'::character varying, 'rear'::character varying, '4x4'::character varying])::text[]))),
    CONSTRAINT specifications_manufacture_month_check CHECK (((manufacture_month >= 1) AND (manufacture_month <= 12))),
    CONSTRAINT specifications_mileage_unit_check CHECK (((mileage_unit)::text = ANY ((ARRAY['km'::character varying, 'mi'::character varying])::text[]))),
    CONSTRAINT specifications_steering_wheel_check CHECK (((steering_wheel)::text = ANY ((ARRAY['left'::character varying, 'right'::character varying])::text[]))),
    CONSTRAINT specifications_transmission_check CHECK (((transmission)::text = ANY ((ARRAY['manual'::character varying, 'automatic'::character varying, 'tiptronic'::character varying, 'variator'::character varying])::text[]))),
    CONSTRAINT valid_airbags_count CHECK (((airbags_count IS NULL) OR ((airbags_count >= 0) AND (airbags_count <= 12)))),
    CONSTRAINT valid_cylinders CHECK (((cylinders IS NULL) OR (cylinders = ANY (ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])))),
    CONSTRAINT valid_drive_type CHECK (((drive_type IS NULL) OR ((drive_type)::text = ANY (ARRAY[('წინა'::character varying)::text, ('უკანა'::character varying)::text, ('4x4'::character varying)::text, ('front'::character varying)::text, ('rear'::character varying)::text])))),
    CONSTRAINT valid_engine_size CHECK (((engine_size IS NULL) OR (engine_size = ANY (ARRAY[0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.0, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 9.0, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10.0, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 11.0, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 12.0, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 13.0])))),
    CONSTRAINT valid_manufacture_month CHECK (((manufacture_month IS NULL) OR ((manufacture_month >= 1) AND (manufacture_month <= 12)))),
    CONSTRAINT valid_mileage_unit CHECK (((mileage_unit)::text = ANY ((ARRAY['km'::character varying, 'mi'::character varying])::text[]))),
    CONSTRAINT valid_steering_wheel CHECK (((steering_wheel IS NULL) OR ((steering_wheel)::text = ANY ((ARRAY['მარცხენა'::character varying, 'მარჯვენა'::character varying])::text[])))),
    CONSTRAINT valid_transmission CHECK (((transmission IS NULL) OR ((transmission)::text = ANY ((ARRAY['მექანიკა'::character varying, 'ავტომატიკა'::character varying, 'ტიპტრონიკი'::character varying, 'ვარიატორი'::character varying])::text[]))))
);


--
-- Name: specifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.specifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: specifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.specifications_id_seq OWNED BY public.specifications.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    age integer NOT NULL,
    gender public.user_gender NOT NULL,
    phone character varying(50) NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlists (
    id integer NOT NULL,
    user_id integer,
    car_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: wishlists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wishlists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wishlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wishlists_id_seq OWNED BY public.wishlists.id;


--
-- Name: brands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);


--
-- Name: car_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_images ALTER COLUMN id SET DEFAULT nextval('public.car_images_id_seq'::regclass);


--
-- Name: car_models id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_models ALTER COLUMN id SET DEFAULT nextval('public.car_models_id_seq'::regclass);


--
-- Name: cars id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cars ALTER COLUMN id SET DEFAULT nextval('public.cars_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: door_counts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_counts ALTER COLUMN id SET DEFAULT nextval('public.door_counts_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: models id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models ALTER COLUMN id SET DEFAULT nextval('public.models_id_seq'::regclass);


--
-- Name: specifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specifications ALTER COLUMN id SET DEFAULT nextval('public.specifications_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wishlists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists ALTER COLUMN id SET DEFAULT nextval('public.wishlists_id_seq'::regclass);


--
-- Name: brands brands_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_name_key UNIQUE (name);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: car_images car_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_images
    ADD CONSTRAINT car_images_pkey PRIMARY KEY (id);


--
-- Name: car_models car_models_name_brand_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_models
    ADD CONSTRAINT car_models_name_brand_id_key UNIQUE (name, brand_id);


--
-- Name: car_models car_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_models
    ADD CONSTRAINT car_models_pkey PRIMARY KEY (id);


--
-- Name: cars cars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: door_counts door_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_counts
    ADD CONSTRAINT door_counts_pkey PRIMARY KEY (id);


--
-- Name: door_counts door_counts_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_counts
    ADD CONSTRAINT door_counts_value_key UNIQUE (value);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: models models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_pkey PRIMARY KEY (id);


--
-- Name: specifications specifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specifications
    ADD CONSTRAINT specifications_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_user_id_car_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_car_id_key UNIQUE (user_id, car_id);


--
-- Name: cars_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cars_search_idx ON public.cars USING gin (search_vector);


--
-- Name: idx_cars_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cars_brand_id ON public.cars USING btree (brand_id);


--
-- Name: idx_cars_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cars_category_id ON public.cars USING btree (category_id);


--
-- Name: idx_cars_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cars_featured ON public.cars USING btree (featured);


--
-- Name: idx_cars_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cars_price ON public.cars USING btree (price);


--
-- Name: idx_cars_price_range; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cars_price_range ON public.cars USING gist (box(point((price)::double precision, ('-1'::integer)::double precision), point((price)::double precision, (1)::double precision)));


--
-- Name: idx_cars_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cars_status ON public.cars USING btree (status);


--
-- Name: idx_cars_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cars_year ON public.cars USING btree (year);


--
-- Name: idx_models_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_models_brand_id ON public.models USING btree (brand_id);


--
-- Name: cars cars_search_vector_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER cars_search_vector_update BEFORE INSERT OR UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.cars_search_vector_update();


--
-- Name: cars update_cars_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: car_images car_images_car_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_images
    ADD CONSTRAINT car_images_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE;


--
-- Name: car_models car_models_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_models
    ADD CONSTRAINT car_models_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- Name: cars cars_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: cars cars_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: cars cars_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cars cars_specification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_specification_id_fkey FOREIGN KEY (specification_id) REFERENCES public.specifications(id) ON DELETE SET NULL;


--
-- Name: specifications fk_door_count; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specifications
    ADD CONSTRAINT fk_door_count FOREIGN KEY (doors) REFERENCES public.door_counts(value);


--
-- Name: models models_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_car_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

