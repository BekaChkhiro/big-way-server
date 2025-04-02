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
        SELECT models INTO brand_models 
        FROM brand_model_mapping 
        WHERE LOWER(brand_name) = LOWER(brand_rec.name);
        
        -- If no direct match, try fuzzy match
        IF brand_models IS NULL THEN
            SELECT models INTO brand_models 
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
    has_seat_heating boolean DEFAULT false,
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
-- Data for Name: backup_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_categories (id, name, created_at) FROM stdin;
11	Excavator	2025-03-10 16:16:23.633315
12	Bulldozer	2025-03-10 16:16:23.633315
13	Crane	2025-03-10 16:16:23.633315
14	Forklift	2025-03-10 16:16:23.633315
15	Tractor	2025-03-10 16:16:23.633315
16	Loader	2025-03-10 16:16:23.633315
17	Dump Truck	2025-03-10 16:16:23.633315
18	Concrete Mixer	2025-03-10 16:16:23.633315
19	Sport Bike	2025-03-10 16:16:23.633315
20	Cruiser	2025-03-10 16:16:23.633315
21	Touring	2025-03-10 16:16:23.633315
22	Adventure	2025-03-10 16:16:23.633315
23	Scooter	2025-03-10 16:16:23.633315
24	Dirt Bike	2025-03-10 16:16:23.633315
25	Chopper	2025-03-10 16:16:23.633315
26	Electric Motorcycle	2025-03-10 16:16:23.633315
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brands (id, name, created_at) FROM stdin;
1	Acura	2025-03-10 16:16:23.633315
2	Aion	2025-03-10 16:16:23.633315
3	AIQAR	2025-03-10 16:16:23.633315
4	Alfa Romeo	2025-03-10 16:16:23.633315
5	AMC	2025-03-10 16:16:23.633315
6	Arcfox	2025-03-10 16:16:23.633315
7	Aston Martin	2025-03-10 16:16:23.633315
8	Audi	2025-03-10 16:16:23.633315
9	Avatr	2025-03-10 16:16:23.633315
10	Baic	2025-03-10 16:16:23.633315
11	Bentley	2025-03-10 16:16:23.633315
12	BMW	2025-03-10 16:16:23.633315
13	Brilliance	2025-03-10 16:16:23.633315
14	Bugatti	2025-03-10 16:16:23.633315
15	Buick	2025-03-10 16:16:23.633315
16	BYD	2025-03-10 16:16:23.633315
17	Cadillac	2025-03-10 16:16:23.633315
18	Changan	2025-03-10 16:16:23.633315
19	Changfeng	2025-03-10 16:16:23.633315
20	Chery	2025-03-10 16:16:23.633315
21	Chevrolet	2025-03-10 16:16:23.633315
22	Chrysler	2025-03-10 16:16:23.633315
23	Citroen	2025-03-10 16:16:23.633315
24	CPI	2025-03-10 16:16:23.633315
25	Dacia	2025-03-10 16:16:23.633315
26	Daewoo	2025-03-10 16:16:23.633315
27	Daihatsu	2025-03-10 16:16:23.633315
28	Datsun	2025-03-10 16:16:23.633315
29	Dayun	2025-03-10 16:16:23.633315
30	DM Telai	2025-03-10 16:16:23.633315
31	Dodge	2025-03-10 16:16:23.633315
32	Dongfeng	2025-03-10 16:16:23.633315
33	DS Automobiles	2025-03-10 16:16:23.633315
34	Exeed	2025-03-10 16:16:23.633315
35	FAW	2025-03-10 16:16:23.633315
36	Ferrari	2025-03-10 16:16:23.633315
37	Fiat	2025-03-10 16:16:23.633315
38	Fisker	2025-03-10 16:16:23.633315
39	Ford	2025-03-10 16:16:23.633315
40	Forthing	2025-03-10 16:16:23.633315
41	Fortschritt	2025-03-10 16:16:23.633315
42	Foton	2025-03-10 16:16:23.633315
43	GAZ	2025-03-10 16:16:23.633315
44	Geely	2025-03-10 16:16:23.633315
45	Genesis	2025-03-10 16:16:23.633315
46	GMC	2025-03-10 16:16:23.633315
47	Gonow	2025-03-10 16:16:23.633315
48	Great Wall	2025-03-10 16:16:23.633315
49	Hafei	2025-03-10 16:16:23.633315
50	Haval	2025-03-10 16:16:23.633315
51	Hiphi	2025-03-10 16:16:23.633315
52	Honda	2025-03-10 16:16:23.633315
53	Hongqi	2025-03-10 16:16:23.633315
54	Huawei	2025-03-10 16:16:23.633315
55	Huawei Inside	2025-03-10 16:16:23.633315
56	Hummer	2025-03-10 16:16:23.633315
57	Hyster	2025-03-10 16:16:23.633315
58	Hyundai	2025-03-10 16:16:23.633315
59	IM Motors	2025-03-10 16:16:23.633315
60	Infiniti	2025-03-10 16:16:23.633315
61	Iran Khodro	2025-03-10 16:16:23.633315
62	Isuzu	2025-03-10 16:16:23.633315
63	Iveco	2025-03-10 16:16:23.633315
64	Izh	2025-03-10 16:16:23.633315
65	JAC	2025-03-10 16:16:23.633315
66	Jaguar	2025-03-10 16:16:23.633315
67	Jeep	2025-03-10 16:16:23.633315
68	Jetour	2025-03-10 16:16:23.633315
69	Karsan	2025-03-10 16:16:23.633315
70	Kia	2025-03-10 16:16:23.633315
71	Lamborghini	2025-03-10 16:16:23.633315
72	Lancia	2025-03-10 16:16:23.633315
73	Land Rover	2025-03-10 16:16:23.633315
74	Leap Motor	2025-03-10 16:16:23.633315
75	Lexus	2025-03-10 16:16:23.633315
76	Lifan	2025-03-10 16:16:23.633315
77	Lincoln	2025-03-10 16:16:23.633315
78	Linde	2025-03-10 16:16:23.633315
79	Lixiang	2025-03-10 16:16:23.633315
80	Lonking	2025-03-10 16:16:23.633315
81	Lotus	2025-03-10 16:16:23.633315
82	LTI	2025-03-10 16:16:23.633315
83	Lynk & Co	2025-03-10 16:16:23.633315
84	Maserati	2025-03-10 16:16:23.633315
85	Maybach	2025-03-10 16:16:23.633315
86	Mazda	2025-03-10 16:16:23.633315
87	McLaren	2025-03-10 16:16:23.633315
88	Mercedes-Benz	2025-03-10 16:16:23.633315
89	Mercury	2025-03-10 16:16:23.633315
90	MG	2025-03-10 16:16:23.633315
91	Mini	2025-03-10 16:16:23.633315
92	Mitsubishi	2025-03-10 16:16:23.633315
93	Mitsuoka	2025-03-10 16:16:23.633315
94	Moskvich	2025-03-10 16:16:23.633315
95	MPM	2025-03-10 16:16:23.633315
96	Neta	2025-03-10 16:16:23.633315
97	Niewiadow	2025-03-10 16:16:23.633315
98	NIO	2025-03-10 16:16:23.633315
99	Nissan	2025-03-10 16:16:23.633315
100	Oldsmobile	2025-03-10 16:16:23.633315
101	Opel	2025-03-10 16:16:23.633315
102	Peugeot	2025-03-10 16:16:23.633315
103	Polestar	2025-03-10 16:16:23.633315
104	Pontiac	2025-03-10 16:16:23.633315
105	Porsche	2025-03-10 16:16:23.633315
106	Proton	2025-03-10 16:16:23.633315
107	Renault	2025-03-10 16:16:23.633315
108	Renault Samsung	2025-03-10 16:16:23.633315
109	Rivian	2025-03-10 16:16:23.633315
110	Roewe	2025-03-10 16:16:23.633315
111	Rolls-Royce	2025-03-10 16:16:23.633315
112	Rover	2025-03-10 16:16:23.633315
113	Saab	2025-03-10 16:16:23.633315
114	Saleen	2025-03-10 16:16:23.633315
115	Saturn	2025-03-10 16:16:23.633315
116	Scion	2025-03-10 16:16:23.633315
117	Seat	2025-03-10 16:16:23.633315
118	Sena	2025-03-10 16:16:23.633315
119	Skoda	2025-03-10 16:16:23.633315
120	Skywell	2025-03-10 16:16:23.633315
121	Smart	2025-03-10 16:16:23.633315
122	Soueast	2025-03-10 16:16:23.633315
123	Ssangyong	2025-03-10 16:16:23.633315
124	Subaru	2025-03-10 16:16:23.633315
125	Suzuki	2025-03-10 16:16:23.633315
126	Tata	2025-03-10 16:16:23.633315
127	Tesla	2025-03-10 16:16:23.633315
128	Toyota	2025-03-10 16:16:23.633315
129	UAZ	2025-03-10 16:16:23.633315
130	Vauxhall	2025-03-10 16:16:23.633315
131	VAZ	2025-03-10 16:16:23.633315
132	Volkswagen	2025-03-10 16:16:23.633315
133	Volvo	2025-03-10 16:16:23.633315
134	Voyah	2025-03-10 16:16:23.633315
135	Xiaomi	2025-03-10 16:16:23.633315
136	Xingtai	2025-03-10 16:16:23.633315
137	Xpeng	2025-03-10 16:16:23.633315
138	YTO	2025-03-10 16:16:23.633315
139	Yuanxin Energy's	2025-03-10 16:16:23.633315
140	ZAZ	2025-03-10 16:16:23.633315
141	Zeekr	2025-03-10 16:16:23.633315
142	Zukida	2025-03-10 16:16:23.633315
143	Zxauto	2025-03-10 16:16:23.633315
\.


--
-- Data for Name: car_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.car_images (id, car_id, image_url, thumbnail_url, medium_url, large_url, is_primary, created_at) FROM stdin;
14	13	https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/original/1743591729266-23790855ff401e6bc944bdaafd40c71faad51a20jpeg.webp	https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/thumbnail/1743591729266-23790855ff401e6bc944bdaafd40c71faad51a20jpeg.webp	https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/medium/1743591729266-23790855ff401e6bc944bdaafd40c71faad51a20jpeg.webp	https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/large/1743591729266-23790855ff401e6bc944bdaafd40c71faad51a20jpeg.webp	f	2025-04-02 15:02:10.650188
16	15	https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/original/1743595537321-bmwm3jpeg.webp	https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/thumbnail/1743595537321-bmwm3jpeg.webp	https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/medium/1743595537321-bmwm3jpeg.webp	https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/large/1743595537321-bmwm3jpeg.webp	f	2025-04-02 16:05:39.767615
17	16	https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/original/1743598289715-suzukiremovebgpreviewpng.webp	https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/thumbnail/1743598289715-suzukiremovebgpreviewpng.webp	https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/medium/1743598289715-suzukiremovebgpreviewpng.webp	https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/large/1743598289715-suzukiremovebgpreviewpng.webp	f	2025-04-02 16:51:31.166542
\.


--
-- Data for Name: car_models; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.car_models (id, name, brand_id) FROM stdin;
1	ILX	1
2	MDX	1
3	NSX	1
4	RDX	1
5	RLX	1
6	TL	1
7	TLX	1
8	TSX	1
9	ZDX	1
10	RSX	1
11	Integra	1
12	Legend	1
13	CL	1
14	EL	1
15	CSX	1
16	SLX	1
17	Vigor	1
18	S	2
19	Y	2
20	V	2
21	LX	2
22	S Plus	2
23	Y Plus	2
24	V Plus	2
25	Hyper GT	2
26	Q	3
27	R	3
28	S	3
29	Giulia	4
30	Stelvio	4
31	4C	4
32	Giulietta	4
33	MiTo	4
34	159	4
35	156	4
36	147	4
37	GT	4
38	Brera	4
39	Spider	4
40	166	4
41	155	4
42	145	4
43	33	4
44	75	4
45	GTV	4
46	164	4
47	Montreal	4
48	Tonale	4
49	Gremlin	5
50	Hornet	5
51	Javelin	5
52	Matador	5
53	Pacer	5
54	Rambler	5
55	Spirit	5
56	Eagle	5
57	Concord	5
58	Alliance	5
59	αT	6
60	αS	6
61	ECF	6
62	DB11	7
63	DBS	7
64	DBX	7
65	Vantage	7
66	Valkyrie	7
67	DB9	7
68	Rapide	7
69	Vanquish	7
70	V8 Vantage	7
71	V12 Vantage	7
72	Virage	7
73	DB7	7
74	DB5	7
75	DB4	7
76	One-77	7
77	A1	8
78	A3	8
79	A4	8
80	A5	8
81	A6	8
82	A7	8
83	A8	8
84	Q2	8
85	Q3	8
86	Q4 e-tron	8
87	Q5	8
88	Q7	8
89	Q8	8
90	e-tron	8
91	TT	8
92	R8	8
93	RS3	8
94	RS4	8
95	RS5	8
96	RS6	8
97	RS7	8
98	RS Q8	8
99	S3	8
100	S4	8
101	S5	8
102	S6	8
103	S7	8
104	S8	8
105	11	9
106	12	9
107	BJ20	10
108	BJ40	10
109	BJ80	10
110	EU5	10
111	EX3	10
112	X3	10
113	X7	10
114	Continental GT	11
115	Flying Spur	11
116	Bentayga	11
117	Mulsanne	11
118	Azure	11
119	Arnage	11
120	Brooklands	11
121	Turbo R	11
122	Continental R	11
123	Continental T	11
124	1 Series	12
125	2 Series	12
126	3 Series	12
127	4 Series	12
128	5 Series	12
129	6 Series	12
130	7 Series	12
131	8 Series	12
132	X1	12
133	X2	12
134	X3	12
135	X4	12
136	X5	12
137	X6	12
138	X7	12
139	Z4	12
140	i3	12
141	i4	12
142	i7	12
143	i8	12
144	iX	12
145	iX3	12
146	M2	12
147	M3	12
148	M4	12
149	M5	12
150	M6	12
151	M8	12
152	XM	12
153	V3	13
154	V5	13
155	V6	13
156	V7	13
157	H230	13
158	H320	13
159	H330	13
160	H530	13
161	M1	13
162	M2	13
163	M3	13
164	Veyron	14
165	Chiron	14
166	Divo	14
167	Centodieci	14
168	La Voiture Noire	14
169	EB110	14
170	Type 35	14
171	Type 57	14
172	Enclave	15
173	Encore	15
174	Envision	15
175	LaCrosse	15
176	Regal	15
177	Verano	15
178	GL8	15
179	Park Avenue	15
180	Century	15
181	LeSabre	15
182	Skylark	15
183	Riviera	15
184	Atto 3	16
185	Dolphin	16
186	Han	16
187	Seal	16
188	Song	16
189	Tang	16
190	Yuan	16
191	e2	16
192	e3	16
193	e6	16
194	F3	16
195	G3	16
196	L3	16
197	M6	16
198	Qin	16
199	S6	16
200	Si Rui	16
201	CT4	17
202	CT5	17
203	Escalade	17
204	XT4	17
205	XT5	17
206	XT6	17
207	LYRIQ	17
208	CTS	17
209	ATS	17
210	XTS	17
211	SRX	17
212	ELR	17
213	DTS	17
214	STS	17
215	DeVille	17
216	Eldorado	17
217	CS15	18
218	CS35	18
219	CS55	18
220	CS75	18
221	CS85	18
222	CS95	18
223	Eado	18
224	Raeton	18
225	UNI-K	18
226	UNI-T	18
227	Liebao CS6	19
228	Liebao CS7	19
229	Liebao Q5	19
230	Arrizo	20
231	Tiggo 3	20
232	Tiggo 4	20
233	Tiggo 5	20
234	Tiggo 7	20
235	Tiggo 8	20
236	QQ	20
237	Fulwin	20
238	E5	20
239	A3	20
240	A5	20
241	Spark	21
242	Sonic	21
243	Cruze	21
244	Malibu	21
245	Impala	21
246	Camaro	21
247	Corvette	21
248	Trax	21
249	Equinox	21
250	Blazer	21
251	Traverse	21
252	Tahoe	21
253	Suburban	21
254	Colorado	21
255	Silverado	21
256	Bolt	21
257	Volt	21
258	Captiva	21
259	Orlando	21
260	300	22
261	Pacifica	22
262	Voyager	22
263	PT Cruiser	22
264	Sebring	22
265	Town & Country	22
266	Crossfire	22
267	Aspen	22
268	Concorde	22
269	LHS	22
270	C1	23
271	C3	23
272	C4	23
273	C5	23
274	C6	23
275	Berlingo	23
276	SpaceTourer	23
277	C3 Aircross	23
278	C4 Cactus	23
279	C5 Aircross	23
280	DS3	23
281	DS4	23
282	DS5	23
283	DS7	23
284	Xsara	23
285	Saxo	23
286	Sandero	25
287	Logan	25
288	Duster	25
289	Spring	25
290	Lodgy	25
291	Dokker	25
292	Jogger	25
293	Lanos	26
294	Nexia	26
295	Matiz	26
296	Nubira	26
297	Leganza	26
298	Espero	26
299	Tico	26
300	Lacetti	26
301	Kalos	26
302	Magnus	26
303	Terios	27
304	Sirion	27
305	Materia	27
306	Charade	27
307	YRV	27
308	Move	27
309	Copen	27
310	Rocky	27
311	Feroza	27
312	Applause	27
313	GO	28
314	GO+	28
315	on-DO	28
316	mi-DO	28
317	redi-GO	28
318	Challenger	31
319	Charger	31
320	Durango	31
321	Journey	31
322	Grand Caravan	31
323	Ram	31
324	Dart	31
325	Avenger	31
326	Caliber	31
327	Nitro	31
328	Viper	31
329	Neon	31
330	AX7	32
331	S30	32
332	H30	32
333	A60	32
334	A30	32
335	EX1	32
336	E70	32
337	Besturn B30	35
338	Besturn B50	35
339	Besturn B70	35
340	Besturn X40	35
341	Besturn X80	35
342	Hongqi H5	35
343	Hongqi H7	35
344	Hongqi E-HS9	35
345	F8 Tributo	36
346	SF90 Stradale	36
347	296 GTB	36
348	Roma	36
349	Portofino	36
350	812 Superfast	36
351	F12	36
352	458	36
353	488	36
354	LaFerrari	36
355	Enzo	36
356	F40	36
357	F50	36
358	Testarossa	36
359	500	37
360	Panda	37
361	Tipo	37
362	500X	37
363	500L	37
364	Punto	37
365	Bravo	37
366	Linea	37
367	Doblo	37
368	Ducato	37
369	Uno	37
370	Palio	37
371	Siena	37
372	Strada	37
373	Fiesta	39
374	Focus	39
375	Mondeo	39
376	Mustang	39
377	EcoSport	39
378	Puma	39
379	Kuga	39
380	Edge	39
381	Explorer	39
382	F-150	39
383	Ranger	39
384	Transit	39
385	Bronco	39
386	Escape	39
387	Expedition	39
388	GT	39
389	Ka	39
390	Fusion	39
391	Coolray	44
392	Azkarra	44
393	Okavango	44
394	Emgrand	44
395	GC9	44
396	Atlas	44
397	Boyue	44
398	Borui	44
399	Vision	44
400	MK	44
401	G70	45
402	G80	45
403	G90	45
404	GV70	45
405	GV80	45
406	GV60	45
407	Sierra	46
408	Canyon	46
409	Terrain	46
410	Acadia	46
411	Yukon	46
412	Savana	46
413	Hummer EV	46
414	Haval H6	48
415	Haval H9	48
416	Haval F7	48
417	Wingle	48
418	Hover	48
419	Safe	48
420	Deer	48
421	Coolbear	48
422	H2	50
423	H4	50
424	H6	50
425	H7	50
426	H8	50
427	H9	50
428	F5	50
429	F7	50
430	F7x	50
431	Jolion	50
432	Big Dog	50
433	Civic	52
434	Accord	52
435	CR-V	52
436	HR-V	52
437	Jazz	52
438	Fit	52
439	City	52
440	Insight	52
441	Pilot	52
442	Odyssey	52
443	Ridgeline	52
444	Element	52
445	S2000	52
446	NSX	52
447	Passport	52
448	e	52
449	i10	58
450	i20	58
451	i30	58
452	i40	58
453	Accent	58
454	Elantra	58
455	Sonata	58
456	Kona	58
457	Tucson	58
458	Santa Fe	58
459	Palisade	58
460	IONIQ	58
461	Veloster	58
462	Genesis	58
463	Creta	58
464	Venue	58
465	Nexo	58
466	Q50	60
467	Q60	60
468	Q70	60
469	QX50	60
470	QX55	60
471	QX60	60
472	QX80	60
473	G35	60
474	G37	60
475	FX35	60
476	FX45	60
477	M35	60
478	M45	60
479	EX35	60
480	D-Max	62
481	MU-X	62
482	Trooper	62
483	Rodeo	62
484	Axiom	62
485	Ascender	62
486	VehiCROSS	62
487	Aska	62
488	Gemini	62
489	Piazza	62
490	iEV7S	65
491	iEV7L	65
492	S2	65
493	S3	65
494	S4	65
495	S5	65
496	S7	65
497	T6	65
498	XE	66
499	XF	66
500	XJ	66
501	F-TYPE	66
502	E-PACE	66
503	F-PACE	66
504	I-PACE	66
505	X-Type	66
506	S-Type	66
507	XK	66
508	XKR	66
509	Wrangler	67
510	Cherokee	67
511	Grand Cherokee	67
512	Compass	67
513	Renegade	67
514	Gladiator	67
515	Commander	67
516	Patriot	67
517	Liberty	67
518	Wagoneer	67
519	Picanto	70
520	Rio	70
521	Cerato	70
522	Forte	70
523	K5	70
524	Optima	70
525	Stinger	70
526	Soul	70
527	Seltos	70
528	Sportage	70
529	Sorento	70
530	Telluride	70
531	Carnival	70
532	EV6	70
533	Niro	70
534	Aventador	71
535	Huracan	71
536	Urus	71
537	Gallardo	71
538	Murcielago	71
539	Diablo	71
540	Countach	71
541	Miura	71
542	Revuelto	71
543	Ypsilon	72
544	Delta	72
545	Thema	72
546	Musa	72
547	Phedra	72
548	Thesis	72
549	Lybra	72
550	Dedra	72
551	Prisma	72
552	Defender	73
553	Discovery	73
554	Discovery Sport	73
555	Range Rover	73
556	Range Rover Sport	73
557	Range Rover Velar	73
558	Range Rover Evoque	73
559	Freelander	73
560	IS	75
561	ES	75
562	GS	75
563	LS	75
564	UX	75
565	NX	75
566	RX	75
567	GX	75
568	LX	75
569	RC	75
570	LC	75
571	CT	75
572	HS	75
573	SC	75
574	Navigator	77
575	Aviator	77
576	Nautilus	77
577	Corsair	77
578	Continental	77
579	MKZ	77
580	MKX	77
581	MKC	77
582	Town Car	77
583	Mark LT	77
584	Elise	81
585	Exige	81
586	Evora	81
587	Evija	81
588	Emira	81
589	Esprit	81
590	Europa	81
591	Elan	81
592	Ghibli	84
593	Quattroporte	84
594	Levante	84
595	MC20	84
596	GranTurismo	84
597	GranCabrio	84
598	Coupe	84
599	Spyder	84
600	Bora	84
601	2	86
602	3	86
603	6	86
604	CX-3	86
605	CX-30	86
606	CX-4	86
607	CX-5	86
608	CX-8	86
609	CX-9	86
610	MX-5	86
611	MX-30	86
612	RX-7	86
613	RX-8	86
614	Tribute	86
615	570S	87
616	570GT	87
617	600LT	87
618	720S	87
619	765LT	87
620	Artura	87
621	GT	87
622	P1	87
623	Senna	87
624	Speedtail	87
625	A-Class	88
626	B-Class	88
627	C-Class	88
628	E-Class	88
629	S-Class	88
630	CLA	88
631	CLS	88
632	GLA	88
633	GLB	88
634	GLC	88
635	GLE	88
636	GLS	88
637	G-Class	88
638	EQA	88
639	EQB	88
640	EQC	88
641	EQE	88
642	EQS	88
643	AMG GT	88
644	ZS	90
645	HS	90
646	RX5	90
647	5	90
648	6	90
649	GS	90
650	3	90
651	Marvel R	90
652	Cyberster	90
653	Cooper	91
654	Clubman	91
655	Countryman	91
656	Paceman	91
657	Roadster	91
658	Coupe	91
659	Convertible	91
660	Electric	91
661	Mirage	92
662	Lancer	92
663	Outlander	92
664	Eclipse Cross	92
665	ASX	92
666	Pajero	92
667	L200	92
668	i-MiEV	92
669	Galant	92
670	Colt	92
671	Grandis	92
672	Space Star	92
673	Micra	99
674	Note	99
675	Leaf	99
676	Pulsar	99
677	Sentra	99
678	Altima	99
679	Maxima	99
680	Juke	99
681	Qashqai	99
682	X-Trail	99
683	Murano	99
684	Pathfinder	99
685	Patrol	99
686	GT-R	99
687	370Z	99
688	Ariya	99
689	Corsa	101
690	Astra	101
691	Insignia	101
692	Mokka	101
693	Crossland	101
694	Grandland	101
695	Combo	101
696	Zafira	101
697	Vectra	101
698	Meriva	101
699	Adam	101
700	Ampera	101
701	108	102
702	208	102
703	308	102
704	508	102
705	2008	102
706	3008	102
707	5008	102
708	Rifter	102
709	Traveller	102
710	Partner	102
711	Expert	102
712	Boxer	102
713	RCZ	102
714	iOn	102
715	911	105
716	718 Cayman	105
717	718 Boxster	105
718	Panamera	105
719	Cayenne	105
720	Macan	105
721	Taycan	105
722	918 Spyder	105
723	Carrera GT	105
724	Clio	107
725	Megane	107
726	Captur	107
727	Kadjar	107
728	Koleos	107
729	Scenic	107
730	Espace	107
731	Twingo	107
732	Zoe	107
733	Talisman	107
734	Kangoo	107
735	Master	107
736	Trafic	107
737	Phantom	111
738	Ghost	111
739	Wraith	111
740	Dawn	111
741	Cullinan	111
742	Silver Shadow	111
743	Silver Spirit	111
744	Corniche	111
745	Citigo	119
746	Fabia	119
747	Scala	119
748	Octavia	119
749	Superb	119
750	Kamiq	119
751	Karoq	119
752	Kodiaq	119
753	Enyaq iV	119
754	Rapid	119
755	Roomster	119
756	Yeti	119
757	Impreza	124
758	Legacy	124
759	Outback	124
760	Forester	124
761	XV	124
762	Ascent	124
763	BRZ	124
764	WRX	124
765	STI	124
766	Levorg	124
767	Tribeca	124
768	Swift	125
769	Baleno	125
770	Ignis	125
771	Vitara	125
772	S-Cross	125
773	Jimny	125
774	XL7	125
775	APV	125
776	Ertiga	125
777	SX4	125
778	Model S	127
779	Model 3	127
780	Model X	127
781	Model Y	127
782	Cybertruck	127
783	Roadster	127
784	Yaris	128
785	Corolla	128
786	Camry	128
787	Crown	128
788	Avalon	128
789	C-HR	128
790	RAV4	128
791	Highlander	128
792	Land Cruiser	128
793	Prius	128
794	Mirai	128
795	86	128
796	Supra	128
797	bZ4X	128
798	Tundra	128
799	Tacoma	128
800	Sienna	128
801	Polo	132
802	Golf	132
803	ID.3	132
804	ID.4	132
805	ID.5	132
806	Passat	132
807	Arteon	132
808	T-Cross	132
809	T-Roc	132
810	Tiguan	132
811	Touareg	132
812	Touran	132
813	Sharan	132
814	Caddy	132
815	Transporter	132
816	up!	132
817	S60	133
818	S90	133
819	V60	133
820	V90	133
821	XC40	133
822	XC60	133
823	XC90	133
824	C40	133
825	Polestar 1	133
826	Polestar 2	133
827	Aragon	24
828	Hussar	24
829	Oliver	24
830	Popcorn	24
831	GTR	24
832	DY150	29
833	DY250	29
834	DYR	29
835	DM125	30
836	DM150	30
837	DM250	30
838	DS 3	33
839	DS 4	33
840	DS 5	33
841	DS 7	33
842	DS 9	33
843	LX	34
844	TXL	34
845	VX	34
846	RX	34
847	Karma	38
848	Ocean	38
849	Pear	38
850	EMotion	38
851	T5	40
852	T5 EVO	40
853	U-Tour	40
854	ZT 300	41
855	ZT 320	41
856	ZT 323	41
857	Tunland	42
858	Sauvana	42
859	View	42
860	Toano	42
861	Gratour	42
862	Gazelle	43
863	Sobol	43
864	Valdai	43
865	Volga	43
866	Siber	43
867	GA200	47
868	GX6	47
869	Troy	47
870	Way	47
871	Lobo	49
872	Ruiyi	49
873	Saibao	49
874	Sigma	49
875	Zhongyi	49
876	X	51
877	Z	51
878	Y	51
879	H5	53
880	H7	53
881	H9	53
882	E-HS9	53
883	L5	53
884	AITO M5	54
885	AITO M7	54
886	M5	55
887	M7	55
888	H40	57
889	H50	57
890	H60	57
891	H70	57
892	L7	59
893	LS7	59
894	Samand	61
895	Dena	61
896	Runna	61
897	Soren	61
898	Peugeot Pars	61
899	Daily	63
900	Eurocargo	63
901	Stralis	63
902	Trakker	63
903	S-Way	63
904	2126	64
905	21261	64
906	Oda	64
907	Fabula	64
908	Planeta	64
909	X70	68
910	X90	68
911	X95	68
912	Dashing	68
913	Jest	69
914	Atak	69
915	Star	69
916	V1	69
917	T03	74
918	S01	74
919	C11	74
920	X60	76
921	Solano	76
922	Smily	76
923	Breez	76
924	Myway	76
925	H20	78
926	H25	78
927	H30	78
928	H35	78
929	One	79
930	L9	79
931	CDM833	80
932	LG833	80
933	CDM856	80
934	TX4	82
935	TX5	82
936	01	83
937	02	83
938	03	83
939	05	83
940	06	83
941	09	83
942	57	85
943	62	85
944	S-Class	85
945	GLS	85
946	Grand Marquis	89
947	Mountaineer	89
948	Mariner	89
949	Milan	89
950	Sable	89
951	Viewt	93
952	Galue	93
953	Himiko	93
954	Rock Star	93
955	Like	93
956	3	94
957	412	94
958	2140	94
959	2141	94
960	3e	94
961	PS160	95
962	Erelis	95
963	V	96
964	U	96
965	S	96
966	N126	97
967	N132	97
968	N250	97
969	ES6	98
970	ES8	98
971	ET5	98
972	ET7	98
973	EC6	98
974	Cutlass	100
975	Delta 88	100
976	442	100
977	Aurora	100
978	Alero	100
979	1	103
980	2	103
981	3	103
982	4	103
983	5	103
984	GTO	104
985	Firebird	104
986	Trans Am	104
987	Grand Prix	104
988	Grand Am	104
989	Saga	106
990	Persona	106
991	X50	106
992	X70	106
993	Exora	106
994	SM3	108
995	SM5	108
996	SM6	108
997	SM7	108
998	QM6	108
999	R1T	109
1000	R1S	109
1001	EDV	109
1002	i5	110
1003	i6	110
1004	RX5	110
1005	Marvel R	110
1006	ER6	110
1007	25	112
1008	45	112
1009	75	112
1010	200	112
1011	400	112
1012	600	112
1013	800	112
1014	900	113
1015	9000	113
1016	9-3	113
1017	9-5	113
1018	9-7X	113
1019	S7	114
1020	S1	114
1021	302	114
1022	S302	114
1023	Ion	115
1024	Vue	115
1025	Sky	115
1026	Aura	115
1027	Outlook	115
1028	tC	116
1029	xB	116
1030	xD	116
1031	FR-S	116
1032	iQ	116
1033	Ibiza	117
1034	Leon	117
1035	Ateca	117
1036	Arona	117
1037	Tarraco	117
1038	S1	118
1039	S2	118
1040	S3	118
1041	ET5	120
1042	D11	120
1043	HT-i	120
1044	fortwo	121
1045	forfour	121
1046	#1	121
1047	EQ fortwo	121
1048	DX3	122
1049	DX7	122
1050	V3	122
1051	V5	122
1052	V7	122
1053	Tivoli	123
1054	Korando	123
1055	Rexton	123
1056	Musso	123
1057	XLV	123
1058	Nexon	126
1059	Harrier	126
1060	Safari	126
1061	Tiago	126
1062	Altroz	126
1063	Patriot	129
1064	Hunter	129
1065	Profi	129
1066	452	129
1067	469	129
1068	Corsa	130
1069	Astra	130
1070	Insignia	130
1071	Mokka	130
1072	Crossland	130
1073	2101	131
1074	2107	131
1075	2110	131
1076	Granta	131
1077	Vesta	131
1078	Free	134
1079	Dream	134
1080	Dreamer	134
1081	MS11	135
1082	XT-A15	136
1083	XT-A25	136
1084	XT-B15	136
1085	P5	137
1086	P7	137
1087	G3	137
1088	G9	137
1089	X904	138
1090	X1004	138
1091	X1204	138
1092	YX-A1	139
1093	YX-B1	139
1094	Slavuta	140
1095	Vida	140
1096	Forza	140
1097	Lanos	140
1098	Sens	140
1099	001	141
1100	009	141
1101	ZK1000	142
1102	ZK2000	142
1103	Grand Tiger	143
1104	Terralord	143
1105	Landmark	143
\.


--
-- Data for Name: cars; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, description, status, featured, seller_id, views_count, created_at, updated_at, search_vector, description_ka, description_en, description_ru) FROM stdin;
13	4	1	15	73	Giulia	2022	77998.00	\N	available	f	3	0	2025-04-02 15:02:10.650188	2025-04-02 15:02:10.650188	'alfa':2A 'giulia':1A 'romeo':3A	კარგი მანქანაა	კარგი მანქანაა	კარგი მანქანაა
15	12	1	17	75	M3	2022	15000.00	\N	available	f	3	0	2025-04-02 16:05:39.767615	2025-04-02 16:05:39.767615	'bmw':2A 'm3':1A	მანქანა	მანქანა	მანქანა
16	8	1	18	76	A3	2017	5500.00	\N	available	f	3	0	2025-04-02 16:51:31.166542	2025-04-02 16:51:31.166542	'a3':1A 'audi':2A	თბილისი	თბილისი	თბილისი
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, created_at) FROM stdin;
11	Excavator	2025-03-10 16:16:23.633315
12	Bulldozer	2025-03-10 16:16:23.633315
13	Crane	2025-03-10 16:16:23.633315
14	Forklift	2025-03-10 16:16:23.633315
15	Tractor	2025-03-10 16:16:23.633315
16	Loader	2025-03-10 16:16:23.633315
17	Dump Truck	2025-03-10 16:16:23.633315
18	Concrete Mixer	2025-03-10 16:16:23.633315
19	Sport Bike	2025-03-10 16:16:23.633315
20	Cruiser	2025-03-10 16:16:23.633315
21	Touring	2025-03-10 16:16:23.633315
22	Adventure	2025-03-10 16:16:23.633315
23	Scooter	2025-03-10 16:16:23.633315
24	Dirt Bike	2025-03-10 16:16:23.633315
25	Chopper	2025-03-10 16:16:23.633315
26	Electric Motorcycle	2025-03-10 16:16:23.633315
1	სედანი	2025-03-19 17:55:50.201229
2	ჯიპი	2025-03-19 17:55:50.20182
3	კუპე	2025-03-19 17:55:50.202265
4	ჰეტჩბექი	2025-03-19 17:55:50.202708
5	უნივერსალი	2025-03-19 17:55:50.213488
6	კაბრიოლეტი	2025-03-19 17:55:50.214146
7	პიკაპი	2025-03-19 17:55:50.214694
8	მინივენი	2025-03-19 17:55:50.215231
9	ლიმუზინი	2025-03-19 17:55:50.215767
10	კროსოვერი	2025-03-19 17:55:50.216407
\.


--
-- Data for Name: door_counts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.door_counts (id, value) FROM stdin;
1	2/3
2	4/5
3	>5
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.locations (id, city, state, country, created_at, is_in_transit, location_type) FROM stdin;
15	თბილისი		საქართველო	2025-04-02 15:02:10.650188	f	\N
17	თბილისი		საქართველო	2025-04-02 16:05:39.767615	f	\N
18	თბილისი		საქართველო	2025-04-02 16:51:31.166542	f	\N
\.


--
-- Data for Name: models; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.models (id, name, brand_id, created_at) FROM stdin;
1	A3	8	2025-04-01 17:04:30.811479
2	A4	8	2025-04-01 17:04:30.811479
3	A6	8	2025-04-01 17:04:30.811479
4	A8	8	2025-04-01 17:04:30.811479
5	Q3	8	2025-04-01 17:04:30.811479
6	Q5	8	2025-04-01 17:04:30.811479
7	Q7	8	2025-04-01 17:04:30.811479
8	e-tron	8	2025-04-01 17:04:30.811479
9	RS6	8	2025-04-01 17:04:30.811479
10	TT	8	2025-04-01 17:04:30.811479
11	3 Series	12	2025-04-01 17:04:30.820519
12	5 Series	12	2025-04-01 17:04:30.820519
13	7 Series	12	2025-04-01 17:04:30.820519
14	X3	12	2025-04-01 17:04:30.820519
15	X5	12	2025-04-01 17:04:30.820519
16	X7	12	2025-04-01 17:04:30.820519
17	M3	12	2025-04-01 17:04:30.820519
18	M5	12	2025-04-01 17:04:30.820519
19	i4	12	2025-04-01 17:04:30.820519
20	iX	12	2025-04-01 17:04:30.820519
21	C-Class	88	2025-04-01 17:04:30.821862
22	E-Class	88	2025-04-01 17:04:30.821862
23	S-Class	88	2025-04-01 17:04:30.821862
24	GLC	88	2025-04-01 17:04:30.821862
25	GLE	88	2025-04-01 17:04:30.821862
26	GLS	88	2025-04-01 17:04:30.821862
27	A-Class	88	2025-04-01 17:04:30.821862
28	CLA	88	2025-04-01 17:04:30.821862
29	AMG GT	88	2025-04-01 17:04:30.821862
30	Camry	128	2025-04-01 17:04:30.823036
31	Corolla	128	2025-04-01 17:04:30.823036
32	RAV4	128	2025-04-01 17:04:30.823036
33	Land Cruiser	128	2025-04-01 17:04:30.823036
34	Prius	128	2025-04-01 17:04:30.823036
35	Highlander	128	2025-04-01 17:04:30.823036
36	Avalon	128	2025-04-01 17:04:30.823036
37	4Runner	128	2025-04-01 17:04:30.823036
38	Tacoma	128	2025-04-01 17:04:30.823036
39	Tundra	128	2025-04-01 17:04:30.823036
40	Civic	52	2025-04-01 17:04:30.824119
41	Accord	52	2025-04-01 17:04:30.824119
42	CR-V	52	2025-04-01 17:04:30.824119
43	Pilot	52	2025-04-01 17:04:30.824119
44	HR-V	52	2025-04-01 17:04:30.824119
45	Odyssey	52	2025-04-01 17:04:30.824119
46	Ridgeline	52	2025-04-01 17:04:30.824119
47	Passport	52	2025-04-01 17:04:30.824119
48	Insight	52	2025-04-01 17:04:30.824119
49	F-150	39	2025-04-01 17:04:30.824957
50	Mustang	39	2025-04-01 17:04:30.824957
51	Explorer	39	2025-04-01 17:04:30.824957
52	Escape	39	2025-04-01 17:04:30.824957
53	Edge	39	2025-04-01 17:04:30.824957
54	Ranger	39	2025-04-01 17:04:30.824957
55	Bronco	39	2025-04-01 17:04:30.824957
56	Expedition	39	2025-04-01 17:04:30.824957
57	Focus	39	2025-04-01 17:04:30.824957
58	Continental GT	11	2025-04-01 17:09:26.496767
59	Flying Spur	11	2025-04-01 17:09:26.496767
60	Bentayga	11	2025-04-01 17:09:26.496767
61	Bacalar	11	2025-04-01 17:09:26.496767
62	Mulliner	11	2025-04-01 17:09:26.496767
63	MDX	1	2025-04-01 17:14:11.712192
64	RDX	1	2025-04-01 17:14:11.712192
65	TLX	1	2025-04-01 17:14:11.712192
66	ILX	1	2025-04-01 17:14:11.712192
67	NSX	1	2025-04-01 17:14:11.712192
68	RLX	1	2025-04-01 17:14:11.712192
69	TL	1	2025-04-01 17:14:11.712192
70	TSX	1	2025-04-01 17:14:11.712192
71	Model 1	2	2025-04-01 17:14:11.712192
72	Model 2	2	2025-04-01 17:14:11.712192
73	Model 3	2	2025-04-01 17:14:11.712192
74	Premium	2	2025-04-01 17:14:11.712192
75	Sport	2	2025-04-01 17:14:11.712192
76	Luxury	2	2025-04-01 17:14:11.712192
77	Standard	2	2025-04-01 17:14:11.712192
78	Model 1	3	2025-04-01 17:14:11.712192
79	Model 2	3	2025-04-01 17:14:11.712192
80	Model 3	3	2025-04-01 17:14:11.712192
81	Premium	3	2025-04-01 17:14:11.712192
82	Sport	3	2025-04-01 17:14:11.712192
83	Luxury	3	2025-04-01 17:14:11.712192
84	Standard	3	2025-04-01 17:14:11.712192
85	Giulia	4	2025-04-01 17:14:11.712192
86	Stelvio	4	2025-04-01 17:14:11.712192
87	4C	4	2025-04-01 17:14:11.712192
88	Giulietta	4	2025-04-01 17:14:11.712192
89	Tonale	4	2025-04-01 17:14:11.712192
90	Model 1	5	2025-04-01 17:14:11.712192
91	Model 2	5	2025-04-01 17:14:11.712192
92	Model 3	5	2025-04-01 17:14:11.712192
93	Premium	5	2025-04-01 17:14:11.712192
94	Sport	5	2025-04-01 17:14:11.712192
95	Luxury	5	2025-04-01 17:14:11.712192
96	Standard	5	2025-04-01 17:14:11.712192
97	Model 1	6	2025-04-01 17:14:11.712192
98	Model 2	6	2025-04-01 17:14:11.712192
99	Model 3	6	2025-04-01 17:14:11.712192
100	Premium	6	2025-04-01 17:14:11.712192
101	Sport	6	2025-04-01 17:14:11.712192
102	Luxury	6	2025-04-01 17:14:11.712192
103	Standard	6	2025-04-01 17:14:11.712192
104	DB11	7	2025-04-01 17:14:11.712192
105	Vantage	7	2025-04-01 17:14:11.712192
106	DBS Superleggera	7	2025-04-01 17:14:11.712192
107	DBX	7	2025-04-01 17:14:11.712192
108	Model 1	9	2025-04-01 17:14:11.712192
109	Model 2	9	2025-04-01 17:14:11.712192
110	Model 3	9	2025-04-01 17:14:11.712192
111	Premium	9	2025-04-01 17:14:11.712192
112	Sport	9	2025-04-01 17:14:11.712192
113	Luxury	9	2025-04-01 17:14:11.712192
114	Standard	9	2025-04-01 17:14:11.712192
115	Model 1	10	2025-04-01 17:14:11.712192
116	Model 2	10	2025-04-01 17:14:11.712192
117	Model 3	10	2025-04-01 17:14:11.712192
118	Premium	10	2025-04-01 17:14:11.712192
119	Sport	10	2025-04-01 17:14:11.712192
120	Luxury	10	2025-04-01 17:14:11.712192
121	Standard	10	2025-04-01 17:14:11.712192
122	Model 1	13	2025-04-01 17:14:11.712192
123	Model 2	13	2025-04-01 17:14:11.712192
124	Model 3	13	2025-04-01 17:14:11.712192
125	Premium	13	2025-04-01 17:14:11.712192
126	Sport	13	2025-04-01 17:14:11.712192
127	Luxury	13	2025-04-01 17:14:11.712192
128	Standard	13	2025-04-01 17:14:11.712192
129	Chiron	14	2025-04-01 17:14:11.712192
130	Veyron	14	2025-04-01 17:14:11.712192
131	Divo	14	2025-04-01 17:14:11.712192
132	Centodieci	14	2025-04-01 17:14:11.712192
133	Enclave	15	2025-04-01 17:14:11.712192
134	Encore	15	2025-04-01 17:14:11.712192
135	Envision	15	2025-04-01 17:14:11.712192
136	LaCrosse	15	2025-04-01 17:14:11.712192
137	Regal	15	2025-04-01 17:14:11.712192
138	Model 1	16	2025-04-01 17:14:11.712192
139	Model 2	16	2025-04-01 17:14:11.712192
140	Model 3	16	2025-04-01 17:14:11.712192
141	Premium	16	2025-04-01 17:14:11.712192
142	Sport	16	2025-04-01 17:14:11.712192
143	Luxury	16	2025-04-01 17:14:11.712192
144	Standard	16	2025-04-01 17:14:11.712192
145	Escalade	17	2025-04-01 17:14:11.712192
146	CT4	17	2025-04-01 17:14:11.712192
147	CT5	17	2025-04-01 17:14:11.712192
148	XT4	17	2025-04-01 17:14:11.712192
149	XT5	17	2025-04-01 17:14:11.712192
150	XT6	17	2025-04-01 17:14:11.712192
151	Model 1	18	2025-04-01 17:14:11.712192
152	Model 2	18	2025-04-01 17:14:11.712192
153	Model 3	18	2025-04-01 17:14:11.712192
154	Premium	18	2025-04-01 17:14:11.712192
155	Sport	18	2025-04-01 17:14:11.712192
156	Luxury	18	2025-04-01 17:14:11.712192
157	Standard	18	2025-04-01 17:14:11.712192
158	Model 1	19	2025-04-01 17:14:11.712192
159	Model 2	19	2025-04-01 17:14:11.712192
160	Model 3	19	2025-04-01 17:14:11.712192
161	Premium	19	2025-04-01 17:14:11.712192
162	Sport	19	2025-04-01 17:14:11.712192
163	Luxury	19	2025-04-01 17:14:11.712192
164	Standard	19	2025-04-01 17:14:11.712192
165	Model 1	20	2025-04-01 17:14:11.712192
166	Model 2	20	2025-04-01 17:14:11.712192
167	Model 3	20	2025-04-01 17:14:11.712192
168	Premium	20	2025-04-01 17:14:11.712192
169	Sport	20	2025-04-01 17:14:11.712192
170	Luxury	20	2025-04-01 17:14:11.712192
171	Standard	20	2025-04-01 17:14:11.712192
172	Silverado	21	2025-04-01 17:14:11.712192
173	Equinox	21	2025-04-01 17:14:11.712192
174	Tahoe	21	2025-04-01 17:14:11.712192
175	Traverse	21	2025-04-01 17:14:11.712192
176	Malibu	21	2025-04-01 17:14:11.712192
177	Camaro	21	2025-04-01 17:14:11.712192
178	Suburban	21	2025-04-01 17:14:11.712192
179	Colorado	21	2025-04-01 17:14:11.712192
180	Blazer	21	2025-04-01 17:14:11.712192
181	300	22	2025-04-01 17:14:11.712192
182	Pacifica	22	2025-04-01 17:14:11.712192
183	Voyager	22	2025-04-01 17:14:11.712192
184	Town & Country	22	2025-04-01 17:14:11.712192
185	Model 1	23	2025-04-01 17:14:11.712192
186	Model 2	23	2025-04-01 17:14:11.712192
187	Model 3	23	2025-04-01 17:14:11.712192
188	Premium	23	2025-04-01 17:14:11.712192
189	Sport	23	2025-04-01 17:14:11.712192
190	Luxury	23	2025-04-01 17:14:11.712192
191	Standard	23	2025-04-01 17:14:11.712192
192	Model 1	24	2025-04-01 17:14:11.712192
193	Model 2	24	2025-04-01 17:14:11.712192
194	Model 3	24	2025-04-01 17:14:11.712192
195	Premium	24	2025-04-01 17:14:11.712192
196	Sport	24	2025-04-01 17:14:11.712192
197	Luxury	24	2025-04-01 17:14:11.712192
198	Standard	24	2025-04-01 17:14:11.712192
199	Model 1	25	2025-04-01 17:14:11.712192
200	Model 2	25	2025-04-01 17:14:11.712192
201	Model 3	25	2025-04-01 17:14:11.712192
202	Premium	25	2025-04-01 17:14:11.712192
203	Sport	25	2025-04-01 17:14:11.712192
204	Luxury	25	2025-04-01 17:14:11.712192
205	Standard	25	2025-04-01 17:14:11.712192
206	Model 1	26	2025-04-01 17:14:11.712192
207	Model 2	26	2025-04-01 17:14:11.712192
208	Model 3	26	2025-04-01 17:14:11.712192
209	Premium	26	2025-04-01 17:14:11.712192
210	Sport	26	2025-04-01 17:14:11.712192
211	Luxury	26	2025-04-01 17:14:11.712192
212	Standard	26	2025-04-01 17:14:11.712192
213	Model 1	27	2025-04-01 17:14:11.712192
214	Model 2	27	2025-04-01 17:14:11.712192
215	Model 3	27	2025-04-01 17:14:11.712192
216	Premium	27	2025-04-01 17:14:11.712192
217	Sport	27	2025-04-01 17:14:11.712192
218	Luxury	27	2025-04-01 17:14:11.712192
219	Standard	27	2025-04-01 17:14:11.712192
220	Model 1	28	2025-04-01 17:14:11.712192
221	Model 2	28	2025-04-01 17:14:11.712192
222	Model 3	28	2025-04-01 17:14:11.712192
223	Premium	28	2025-04-01 17:14:11.712192
224	Sport	28	2025-04-01 17:14:11.712192
225	Luxury	28	2025-04-01 17:14:11.712192
226	Standard	28	2025-04-01 17:14:11.712192
227	Model 1	29	2025-04-01 17:14:11.712192
228	Model 2	29	2025-04-01 17:14:11.712192
229	Model 3	29	2025-04-01 17:14:11.712192
230	Premium	29	2025-04-01 17:14:11.712192
231	Sport	29	2025-04-01 17:14:11.712192
232	Luxury	29	2025-04-01 17:14:11.712192
233	Standard	29	2025-04-01 17:14:11.712192
234	Model 1	30	2025-04-01 17:14:11.712192
235	Model 2	30	2025-04-01 17:14:11.712192
236	Model 3	30	2025-04-01 17:14:11.712192
237	Premium	30	2025-04-01 17:14:11.712192
238	Sport	30	2025-04-01 17:14:11.712192
239	Luxury	30	2025-04-01 17:14:11.712192
240	Standard	30	2025-04-01 17:14:11.712192
241	Challenger	31	2025-04-01 17:14:11.712192
242	Charger	31	2025-04-01 17:14:11.712192
243	Durango	31	2025-04-01 17:14:11.712192
244	Journey	31	2025-04-01 17:14:11.712192
245	Grand Caravan	31	2025-04-01 17:14:11.712192
246	Model 1	32	2025-04-01 17:14:11.712192
247	Model 2	32	2025-04-01 17:14:11.712192
248	Model 3	32	2025-04-01 17:14:11.712192
249	Premium	32	2025-04-01 17:14:11.712192
250	Sport	32	2025-04-01 17:14:11.712192
251	Luxury	32	2025-04-01 17:14:11.712192
252	Standard	32	2025-04-01 17:14:11.712192
253	Model 1	33	2025-04-01 17:14:11.712192
254	Model 2	33	2025-04-01 17:14:11.712192
255	Model 3	33	2025-04-01 17:14:11.712192
256	Premium	33	2025-04-01 17:14:11.712192
257	Sport	33	2025-04-01 17:14:11.712192
258	Luxury	33	2025-04-01 17:14:11.712192
259	Standard	33	2025-04-01 17:14:11.712192
260	Model 1	34	2025-04-01 17:14:11.712192
261	Model 2	34	2025-04-01 17:14:11.712192
262	Model 3	34	2025-04-01 17:14:11.712192
263	Premium	34	2025-04-01 17:14:11.712192
264	Sport	34	2025-04-01 17:14:11.712192
265	Luxury	34	2025-04-01 17:14:11.712192
266	Standard	34	2025-04-01 17:14:11.712192
267	Model 1	35	2025-04-01 17:14:11.712192
268	Model 2	35	2025-04-01 17:14:11.712192
269	Model 3	35	2025-04-01 17:14:11.712192
270	Premium	35	2025-04-01 17:14:11.712192
271	Sport	35	2025-04-01 17:14:11.712192
272	Luxury	35	2025-04-01 17:14:11.712192
273	Standard	35	2025-04-01 17:14:11.712192
274	Roma	36	2025-04-01 17:14:11.712192
275	Portofino	36	2025-04-01 17:14:11.712192
276	SF90 Stradale	36	2025-04-01 17:14:11.712192
277	F8 Tributo	36	2025-04-01 17:14:11.712192
278	812 Superfast	36	2025-04-01 17:14:11.712192
279	500	37	2025-04-01 17:14:11.712192
280	500X	37	2025-04-01 17:14:11.712192
281	500L	37	2025-04-01 17:14:11.712192
282	124 Spider	37	2025-04-01 17:14:11.712192
283	Ocean	38	2025-04-01 17:14:11.712192
284	Karma	38	2025-04-01 17:14:11.712192
285	Model 1	40	2025-04-01 17:14:11.712192
286	Model 2	40	2025-04-01 17:14:11.712192
287	Model 3	40	2025-04-01 17:14:11.712192
288	Premium	40	2025-04-01 17:14:11.712192
289	Sport	40	2025-04-01 17:14:11.712192
290	Luxury	40	2025-04-01 17:14:11.712192
291	Standard	40	2025-04-01 17:14:11.712192
292	Model 1	41	2025-04-01 17:14:11.712192
293	Model 2	41	2025-04-01 17:14:11.712192
294	Model 3	41	2025-04-01 17:14:11.712192
295	Premium	41	2025-04-01 17:14:11.712192
296	Sport	41	2025-04-01 17:14:11.712192
297	Luxury	41	2025-04-01 17:14:11.712192
298	Standard	41	2025-04-01 17:14:11.712192
299	Model 1	42	2025-04-01 17:14:11.712192
300	Model 2	42	2025-04-01 17:14:11.712192
301	Model 3	42	2025-04-01 17:14:11.712192
302	Premium	42	2025-04-01 17:14:11.712192
303	Sport	42	2025-04-01 17:14:11.712192
304	Luxury	42	2025-04-01 17:14:11.712192
305	Standard	42	2025-04-01 17:14:11.712192
306	Model 1	43	2025-04-01 17:14:11.712192
307	Model 2	43	2025-04-01 17:14:11.712192
308	Model 3	43	2025-04-01 17:14:11.712192
309	Premium	43	2025-04-01 17:14:11.712192
310	Sport	43	2025-04-01 17:14:11.712192
311	Luxury	43	2025-04-01 17:14:11.712192
312	Standard	43	2025-04-01 17:14:11.712192
313	Model 1	44	2025-04-01 17:14:11.712192
314	Model 2	44	2025-04-01 17:14:11.712192
315	Model 3	44	2025-04-01 17:14:11.712192
316	Premium	44	2025-04-01 17:14:11.712192
317	Sport	44	2025-04-01 17:14:11.712192
318	Luxury	44	2025-04-01 17:14:11.712192
319	Standard	44	2025-04-01 17:14:11.712192
320	G70	45	2025-04-01 17:14:11.712192
321	G80	45	2025-04-01 17:14:11.712192
322	G90	45	2025-04-01 17:14:11.712192
323	GV70	45	2025-04-01 17:14:11.712192
324	GV80	45	2025-04-01 17:14:11.712192
325	Sierra	46	2025-04-01 17:14:11.712192
326	Yukon	46	2025-04-01 17:14:11.712192
327	Acadia	46	2025-04-01 17:14:11.712192
328	Terrain	46	2025-04-01 17:14:11.712192
329	Canyon	46	2025-04-01 17:14:11.712192
330	Model 1	47	2025-04-01 17:14:11.712192
331	Model 2	47	2025-04-01 17:14:11.712192
332	Model 3	47	2025-04-01 17:14:11.712192
333	Premium	47	2025-04-01 17:14:11.712192
334	Sport	47	2025-04-01 17:14:11.712192
335	Luxury	47	2025-04-01 17:14:11.712192
336	Standard	47	2025-04-01 17:14:11.712192
337	Model 1	48	2025-04-01 17:14:11.712192
338	Model 2	48	2025-04-01 17:14:11.712192
339	Model 3	48	2025-04-01 17:14:11.712192
340	Premium	48	2025-04-01 17:14:11.712192
341	Sport	48	2025-04-01 17:14:11.712192
342	Luxury	48	2025-04-01 17:14:11.712192
343	Standard	48	2025-04-01 17:14:11.712192
344	Model 1	49	2025-04-01 17:14:11.712192
345	Model 2	49	2025-04-01 17:14:11.712192
346	Model 3	49	2025-04-01 17:14:11.712192
347	Premium	49	2025-04-01 17:14:11.712192
348	Sport	49	2025-04-01 17:14:11.712192
349	Luxury	49	2025-04-01 17:14:11.712192
350	Standard	49	2025-04-01 17:14:11.712192
351	Model 1	50	2025-04-01 17:14:11.712192
352	Model 2	50	2025-04-01 17:14:11.712192
353	Model 3	50	2025-04-01 17:14:11.712192
354	Premium	50	2025-04-01 17:14:11.712192
355	Sport	50	2025-04-01 17:14:11.712192
356	Luxury	50	2025-04-01 17:14:11.712192
357	Standard	50	2025-04-01 17:14:11.712192
358	Model 1	51	2025-04-01 17:14:11.712192
359	Model 2	51	2025-04-01 17:14:11.712192
360	Model 3	51	2025-04-01 17:14:11.712192
361	Premium	51	2025-04-01 17:14:11.712192
362	Sport	51	2025-04-01 17:14:11.712192
363	Luxury	51	2025-04-01 17:14:11.712192
364	Standard	51	2025-04-01 17:14:11.712192
365	Model 1	53	2025-04-01 17:14:11.712192
366	Model 2	53	2025-04-01 17:14:11.712192
367	Model 3	53	2025-04-01 17:14:11.712192
368	Premium	53	2025-04-01 17:14:11.712192
369	Sport	53	2025-04-01 17:14:11.712192
370	Luxury	53	2025-04-01 17:14:11.712192
371	Standard	53	2025-04-01 17:14:11.712192
372	Model 1	54	2025-04-01 17:14:11.712192
373	Model 2	54	2025-04-01 17:14:11.712192
374	Model 3	54	2025-04-01 17:14:11.712192
375	Premium	54	2025-04-01 17:14:11.712192
376	Sport	54	2025-04-01 17:14:11.712192
377	Luxury	54	2025-04-01 17:14:11.712192
378	Standard	54	2025-04-01 17:14:11.712192
379	Model 1	55	2025-04-01 17:14:11.712192
380	Model 2	55	2025-04-01 17:14:11.712192
381	Model 3	55	2025-04-01 17:14:11.712192
382	Premium	55	2025-04-01 17:14:11.712192
383	Sport	55	2025-04-01 17:14:11.712192
384	Luxury	55	2025-04-01 17:14:11.712192
385	Standard	55	2025-04-01 17:14:11.712192
386	Model 1	56	2025-04-01 17:14:11.712192
387	Model 2	56	2025-04-01 17:14:11.712192
388	Model 3	56	2025-04-01 17:14:11.712192
389	Premium	56	2025-04-01 17:14:11.712192
390	Sport	56	2025-04-01 17:14:11.712192
391	Luxury	56	2025-04-01 17:14:11.712192
392	Standard	56	2025-04-01 17:14:11.712192
393	Model 1	57	2025-04-01 17:14:11.712192
394	Model 2	57	2025-04-01 17:14:11.712192
395	Model 3	57	2025-04-01 17:14:11.712192
396	Premium	57	2025-04-01 17:14:11.712192
397	Sport	57	2025-04-01 17:14:11.712192
398	Luxury	57	2025-04-01 17:14:11.712192
399	Standard	57	2025-04-01 17:14:11.712192
400	Elantra	58	2025-04-01 17:14:11.712192
401	Sonata	58	2025-04-01 17:14:11.712192
402	Tucson	58	2025-04-01 17:14:11.712192
403	Santa Fe	58	2025-04-01 17:14:11.712192
404	Palisade	58	2025-04-01 17:14:11.712192
405	Kona	58	2025-04-01 17:14:11.712192
406	Venue	58	2025-04-01 17:14:11.712192
407	Ioniq	58	2025-04-01 17:14:11.712192
408	Model 1	59	2025-04-01 17:14:11.712192
409	Model 2	59	2025-04-01 17:14:11.712192
410	Model 3	59	2025-04-01 17:14:11.712192
411	Premium	59	2025-04-01 17:14:11.712192
412	Sport	59	2025-04-01 17:14:11.712192
413	Luxury	59	2025-04-01 17:14:11.712192
414	Standard	59	2025-04-01 17:14:11.712192
415	Q50	60	2025-04-01 17:14:11.712192
416	Q60	60	2025-04-01 17:14:11.712192
417	QX50	60	2025-04-01 17:14:11.712192
418	QX60	60	2025-04-01 17:14:11.712192
419	QX80	60	2025-04-01 17:14:11.712192
420	QX55	60	2025-04-01 17:14:11.712192
421	QX30	60	2025-04-01 17:14:11.712192
422	Model 1	61	2025-04-01 17:14:11.712192
423	Model 2	61	2025-04-01 17:14:11.712192
424	Model 3	61	2025-04-01 17:14:11.712192
425	Premium	61	2025-04-01 17:14:11.712192
426	Sport	61	2025-04-01 17:14:11.712192
427	Luxury	61	2025-04-01 17:14:11.712192
428	Standard	61	2025-04-01 17:14:11.712192
429	Model 1	62	2025-04-01 17:14:11.712192
430	Model 2	62	2025-04-01 17:14:11.712192
431	Model 3	62	2025-04-01 17:14:11.712192
432	Premium	62	2025-04-01 17:14:11.712192
433	Sport	62	2025-04-01 17:14:11.712192
434	Luxury	62	2025-04-01 17:14:11.712192
435	Standard	62	2025-04-01 17:14:11.712192
436	Model 1	63	2025-04-01 17:14:11.712192
437	Model 2	63	2025-04-01 17:14:11.712192
438	Model 3	63	2025-04-01 17:14:11.712192
439	Premium	63	2025-04-01 17:14:11.712192
440	Sport	63	2025-04-01 17:14:11.712192
441	Luxury	63	2025-04-01 17:14:11.712192
442	Standard	63	2025-04-01 17:14:11.712192
443	Model 1	64	2025-04-01 17:14:11.712192
444	Model 2	64	2025-04-01 17:14:11.712192
445	Model 3	64	2025-04-01 17:14:11.712192
446	Premium	64	2025-04-01 17:14:11.712192
447	Sport	64	2025-04-01 17:14:11.712192
448	Luxury	64	2025-04-01 17:14:11.712192
449	Standard	64	2025-04-01 17:14:11.712192
450	Model 1	65	2025-04-01 17:14:11.712192
451	Model 2	65	2025-04-01 17:14:11.712192
452	Model 3	65	2025-04-01 17:14:11.712192
453	Premium	65	2025-04-01 17:14:11.712192
454	Sport	65	2025-04-01 17:14:11.712192
455	Luxury	65	2025-04-01 17:14:11.712192
456	Standard	65	2025-04-01 17:14:11.712192
457	F-PACE	66	2025-04-01 17:14:11.712192
458	E-PACE	66	2025-04-01 17:14:11.712192
459	I-PACE	66	2025-04-01 17:14:11.712192
460	XE	66	2025-04-01 17:14:11.712192
461	XF	66	2025-04-01 17:14:11.712192
462	XJ	66	2025-04-01 17:14:11.712192
463	F-TYPE	66	2025-04-01 17:14:11.712192
464	Grand Cherokee	67	2025-04-01 17:14:11.712192
465	Cherokee	67	2025-04-01 17:14:11.712192
466	Wrangler	67	2025-04-01 17:14:11.712192
467	Compass	67	2025-04-01 17:14:11.712192
468	Renegade	67	2025-04-01 17:14:11.712192
469	Gladiator	67	2025-04-01 17:14:11.712192
470	Model 1	68	2025-04-01 17:14:11.712192
471	Model 2	68	2025-04-01 17:14:11.712192
472	Model 3	68	2025-04-01 17:14:11.712192
473	Premium	68	2025-04-01 17:14:11.712192
474	Sport	68	2025-04-01 17:14:11.712192
475	Luxury	68	2025-04-01 17:14:11.712192
476	Standard	68	2025-04-01 17:14:11.712192
477	Model 1	69	2025-04-01 17:14:11.712192
478	Model 2	69	2025-04-01 17:14:11.712192
479	Model 3	69	2025-04-01 17:14:11.712192
480	Premium	69	2025-04-01 17:14:11.712192
481	Sport	69	2025-04-01 17:14:11.712192
482	Luxury	69	2025-04-01 17:14:11.712192
483	Standard	69	2025-04-01 17:14:11.712192
484	Forte	70	2025-04-01 17:14:11.712192
485	K5	70	2025-04-01 17:14:11.712192
486	Sportage	70	2025-04-01 17:14:11.712192
487	Telluride	70	2025-04-01 17:14:11.712192
488	Sorento	70	2025-04-01 17:14:11.712192
489	Soul	70	2025-04-01 17:14:11.712192
490	Seltos	70	2025-04-01 17:14:11.712192
491	Carnival	70	2025-04-01 17:14:11.712192
492	Stinger	70	2025-04-01 17:14:11.712192
493	Aventador	71	2025-04-01 17:14:11.712192
494	Huracán	71	2025-04-01 17:14:11.712192
495	Urus	71	2025-04-01 17:14:11.712192
496	Model 1	72	2025-04-01 17:14:11.712192
497	Model 2	72	2025-04-01 17:14:11.712192
498	Model 3	72	2025-04-01 17:14:11.712192
499	Premium	72	2025-04-01 17:14:11.712192
500	Sport	72	2025-04-01 17:14:11.712192
501	Luxury	72	2025-04-01 17:14:11.712192
502	Standard	72	2025-04-01 17:14:11.712192
503	Range Rover	73	2025-04-01 17:14:11.712192
504	Range Rover Sport	73	2025-04-01 17:14:11.712192
505	Discovery	73	2025-04-01 17:14:11.712192
506	Defender	73	2025-04-01 17:14:11.712192
507	Evoque	73	2025-04-01 17:14:11.712192
508	Velar	73	2025-04-01 17:14:11.712192
509	Model 1	74	2025-04-01 17:14:11.712192
510	Model 2	74	2025-04-01 17:14:11.712192
511	Model 3	74	2025-04-01 17:14:11.712192
512	Premium	74	2025-04-01 17:14:11.712192
513	Sport	74	2025-04-01 17:14:11.712192
514	Luxury	74	2025-04-01 17:14:11.712192
515	Standard	74	2025-04-01 17:14:11.712192
516	ES	75	2025-04-01 17:14:11.712192
517	LS	75	2025-04-01 17:14:11.712192
518	RX	75	2025-04-01 17:14:11.712192
519	NX	75	2025-04-01 17:14:11.712192
520	UX	75	2025-04-01 17:14:11.712192
521	IS	75	2025-04-01 17:14:11.712192
522	GX	75	2025-04-01 17:14:11.712192
523	LX	75	2025-04-01 17:14:11.712192
524	RC	75	2025-04-01 17:14:11.712192
525	LC	75	2025-04-01 17:14:11.712192
526	Model 1	76	2025-04-01 17:14:11.712192
527	Model 2	76	2025-04-01 17:14:11.712192
528	Model 3	76	2025-04-01 17:14:11.712192
529	Premium	76	2025-04-01 17:14:11.712192
530	Sport	76	2025-04-01 17:14:11.712192
531	Luxury	76	2025-04-01 17:14:11.712192
532	Standard	76	2025-04-01 17:14:11.712192
533	Navigator	77	2025-04-01 17:14:11.712192
534	Aviator	77	2025-04-01 17:14:11.712192
535	Nautilus	77	2025-04-01 17:14:11.712192
536	Corsair	77	2025-04-01 17:14:11.712192
537	Continental	77	2025-04-01 17:14:11.712192
538	Model 1	78	2025-04-01 17:14:11.712192
539	Model 2	78	2025-04-01 17:14:11.712192
540	Model 3	78	2025-04-01 17:14:11.712192
541	Premium	78	2025-04-01 17:14:11.712192
542	Sport	78	2025-04-01 17:14:11.712192
543	Luxury	78	2025-04-01 17:14:11.712192
544	Standard	78	2025-04-01 17:14:11.712192
545	Model 1	79	2025-04-01 17:14:11.712192
546	Model 2	79	2025-04-01 17:14:11.712192
547	Model 3	79	2025-04-01 17:14:11.712192
548	Premium	79	2025-04-01 17:14:11.712192
549	Sport	79	2025-04-01 17:14:11.712192
550	Luxury	79	2025-04-01 17:14:11.712192
551	Standard	79	2025-04-01 17:14:11.712192
552	Model 1	80	2025-04-01 17:14:11.712192
553	Model 2	80	2025-04-01 17:14:11.712192
554	Model 3	80	2025-04-01 17:14:11.712192
555	Premium	80	2025-04-01 17:14:11.712192
556	Sport	80	2025-04-01 17:14:11.712192
557	Luxury	80	2025-04-01 17:14:11.712192
558	Standard	80	2025-04-01 17:14:11.712192
559	Model 1	81	2025-04-01 17:14:11.712192
560	Model 2	81	2025-04-01 17:14:11.712192
561	Model 3	81	2025-04-01 17:14:11.712192
562	Premium	81	2025-04-01 17:14:11.712192
563	Sport	81	2025-04-01 17:14:11.712192
564	Luxury	81	2025-04-01 17:14:11.712192
565	Standard	81	2025-04-01 17:14:11.712192
566	Model 1	82	2025-04-01 17:14:11.712192
567	Model 2	82	2025-04-01 17:14:11.712192
568	Model 3	82	2025-04-01 17:14:11.712192
569	Premium	82	2025-04-01 17:14:11.712192
570	Sport	82	2025-04-01 17:14:11.712192
571	Luxury	82	2025-04-01 17:14:11.712192
572	Standard	82	2025-04-01 17:14:11.712192
573	Model 1	83	2025-04-01 17:14:11.712192
574	Model 2	83	2025-04-01 17:14:11.712192
575	Model 3	83	2025-04-01 17:14:11.712192
576	Premium	83	2025-04-01 17:14:11.712192
577	Sport	83	2025-04-01 17:14:11.712192
578	Luxury	83	2025-04-01 17:14:11.712192
579	Standard	83	2025-04-01 17:14:11.712192
580	Ghibli	84	2025-04-01 17:14:11.712192
581	Levante	84	2025-04-01 17:14:11.712192
582	Quattroporte	84	2025-04-01 17:14:11.712192
583	MC20	84	2025-04-01 17:14:11.712192
584	GranTurismo	84	2025-04-01 17:14:11.712192
585	Model 1	85	2025-04-01 17:14:11.712192
586	Model 2	85	2025-04-01 17:14:11.712192
587	Model 3	85	2025-04-01 17:14:11.712192
588	Premium	85	2025-04-01 17:14:11.712192
589	Sport	85	2025-04-01 17:14:11.712192
590	Luxury	85	2025-04-01 17:14:11.712192
591	Standard	85	2025-04-01 17:14:11.712192
592	Mazda3	86	2025-04-01 17:14:11.712192
593	Mazda6	86	2025-04-01 17:14:11.712192
594	CX-5	86	2025-04-01 17:14:11.712192
595	CX-9	86	2025-04-01 17:14:11.712192
596	CX-30	86	2025-04-01 17:14:11.712192
597	MX-5 Miata	86	2025-04-01 17:14:11.712192
598	CX-3	86	2025-04-01 17:14:11.712192
599	CX-50	86	2025-04-01 17:14:11.712192
600	Model 1	87	2025-04-01 17:14:11.712192
601	Model 2	87	2025-04-01 17:14:11.712192
602	Model 3	87	2025-04-01 17:14:11.712192
603	Premium	87	2025-04-01 17:14:11.712192
604	Sport	87	2025-04-01 17:14:11.712192
605	Luxury	87	2025-04-01 17:14:11.712192
606	Standard	87	2025-04-01 17:14:11.712192
607	Model 1	89	2025-04-01 17:14:11.712192
608	Model 2	89	2025-04-01 17:14:11.712192
609	Model 3	89	2025-04-01 17:14:11.712192
610	Premium	89	2025-04-01 17:14:11.712192
611	Sport	89	2025-04-01 17:14:11.712192
612	Luxury	89	2025-04-01 17:14:11.712192
613	Standard	89	2025-04-01 17:14:11.712192
614	Model 1	90	2025-04-01 17:14:11.712192
615	Model 2	90	2025-04-01 17:14:11.712192
616	Model 3	90	2025-04-01 17:14:11.712192
617	Premium	90	2025-04-01 17:14:11.712192
618	Sport	90	2025-04-01 17:14:11.712192
619	Luxury	90	2025-04-01 17:14:11.712192
620	Standard	90	2025-04-01 17:14:11.712192
621	Cooper	91	2025-04-01 17:14:11.712192
622	Countryman	91	2025-04-01 17:14:11.712192
623	Clubman	91	2025-04-01 17:14:11.712192
624	Convertible	91	2025-04-01 17:14:11.712192
625	Electric	91	2025-04-01 17:14:11.712192
626	Outlander	92	2025-04-01 17:14:11.712192
627	Eclipse Cross	92	2025-04-01 17:14:11.712192
628	Mirage	92	2025-04-01 17:14:11.712192
629	Outlander Sport	92	2025-04-01 17:14:11.712192
630	Model 1	93	2025-04-01 17:14:11.712192
631	Model 2	93	2025-04-01 17:14:11.712192
632	Model 3	93	2025-04-01 17:14:11.712192
633	Premium	93	2025-04-01 17:14:11.712192
634	Sport	93	2025-04-01 17:14:11.712192
635	Luxury	93	2025-04-01 17:14:11.712192
636	Standard	93	2025-04-01 17:14:11.712192
637	Model 1	94	2025-04-01 17:14:11.712192
638	Model 2	94	2025-04-01 17:14:11.712192
639	Model 3	94	2025-04-01 17:14:11.712192
640	Premium	94	2025-04-01 17:14:11.712192
641	Sport	94	2025-04-01 17:14:11.712192
642	Luxury	94	2025-04-01 17:14:11.712192
643	Standard	94	2025-04-01 17:14:11.712192
644	Model 1	95	2025-04-01 17:14:11.712192
645	Model 2	95	2025-04-01 17:14:11.712192
646	Model 3	95	2025-04-01 17:14:11.712192
647	Premium	95	2025-04-01 17:14:11.712192
648	Sport	95	2025-04-01 17:14:11.712192
649	Luxury	95	2025-04-01 17:14:11.712192
650	Standard	95	2025-04-01 17:14:11.712192
651	Model 1	96	2025-04-01 17:14:11.712192
652	Model 2	96	2025-04-01 17:14:11.712192
653	Model 3	96	2025-04-01 17:14:11.712192
654	Premium	96	2025-04-01 17:14:11.712192
655	Sport	96	2025-04-01 17:14:11.712192
656	Luxury	96	2025-04-01 17:14:11.712192
657	Standard	96	2025-04-01 17:14:11.712192
658	Model 1	97	2025-04-01 17:14:11.712192
659	Model 2	97	2025-04-01 17:14:11.712192
660	Model 3	97	2025-04-01 17:14:11.712192
661	Premium	97	2025-04-01 17:14:11.712192
662	Sport	97	2025-04-01 17:14:11.712192
663	Luxury	97	2025-04-01 17:14:11.712192
664	Standard	97	2025-04-01 17:14:11.712192
665	Model 1	98	2025-04-01 17:14:11.712192
666	Model 2	98	2025-04-01 17:14:11.712192
667	Model 3	98	2025-04-01 17:14:11.712192
668	Premium	98	2025-04-01 17:14:11.712192
669	Sport	98	2025-04-01 17:14:11.712192
670	Luxury	98	2025-04-01 17:14:11.712192
671	Standard	98	2025-04-01 17:14:11.712192
672	Altima	99	2025-04-01 17:14:11.712192
673	Maxima	99	2025-04-01 17:14:11.712192
674	Sentra	99	2025-04-01 17:14:11.712192
675	Rogue	99	2025-04-01 17:14:11.712192
676	Pathfinder	99	2025-04-01 17:14:11.712192
677	Murano	99	2025-04-01 17:14:11.712192
678	Kicks	99	2025-04-01 17:14:11.712192
679	Armada	99	2025-04-01 17:14:11.712192
680	Titan	99	2025-04-01 17:14:11.712192
681	370Z	99	2025-04-01 17:14:11.712192
682	Model 1	100	2025-04-01 17:14:11.712192
683	Model 2	100	2025-04-01 17:14:11.712192
684	Model 3	100	2025-04-01 17:14:11.712192
685	Premium	100	2025-04-01 17:14:11.712192
686	Sport	100	2025-04-01 17:14:11.712192
687	Luxury	100	2025-04-01 17:14:11.712192
688	Standard	100	2025-04-01 17:14:11.712192
689	Model 1	101	2025-04-01 17:14:11.712192
690	Model 2	101	2025-04-01 17:14:11.712192
691	Model 3	101	2025-04-01 17:14:11.712192
692	Premium	101	2025-04-01 17:14:11.712192
693	Sport	101	2025-04-01 17:14:11.712192
694	Luxury	101	2025-04-01 17:14:11.712192
695	Standard	101	2025-04-01 17:14:11.712192
696	Model 1	102	2025-04-01 17:14:11.712192
697	Model 2	102	2025-04-01 17:14:11.712192
698	Model 3	102	2025-04-01 17:14:11.712192
699	Premium	102	2025-04-01 17:14:11.712192
700	Sport	102	2025-04-01 17:14:11.712192
701	Luxury	102	2025-04-01 17:14:11.712192
702	Standard	102	2025-04-01 17:14:11.712192
703	Polestar 1	103	2025-04-01 17:14:11.712192
704	Polestar 2	103	2025-04-01 17:14:11.712192
705	Polestar 3	103	2025-04-01 17:14:11.712192
706	Model 1	104	2025-04-01 17:14:11.712192
707	Model 2	104	2025-04-01 17:14:11.712192
708	Model 3	104	2025-04-01 17:14:11.712192
709	Premium	104	2025-04-01 17:14:11.712192
710	Sport	104	2025-04-01 17:14:11.712192
711	Luxury	104	2025-04-01 17:14:11.712192
712	Standard	104	2025-04-01 17:14:11.712192
713	911	105	2025-04-01 17:14:11.712192
714	Cayenne	105	2025-04-01 17:14:11.712192
715	Panamera	105	2025-04-01 17:14:11.712192
716	Macan	105	2025-04-01 17:14:11.712192
717	Taycan	105	2025-04-01 17:14:11.712192
718	Cayman	105	2025-04-01 17:14:11.712192
719	Boxster	105	2025-04-01 17:14:11.712192
720	Model 1	106	2025-04-01 17:14:11.712192
721	Model 2	106	2025-04-01 17:14:11.712192
722	Model 3	106	2025-04-01 17:14:11.712192
723	Premium	106	2025-04-01 17:14:11.712192
724	Sport	106	2025-04-01 17:14:11.712192
725	Luxury	106	2025-04-01 17:14:11.712192
726	Standard	106	2025-04-01 17:14:11.712192
727	Model 1	107	2025-04-01 17:14:11.712192
728	Model 2	107	2025-04-01 17:14:11.712192
729	Model 3	107	2025-04-01 17:14:11.712192
730	Premium	107	2025-04-01 17:14:11.712192
731	Sport	107	2025-04-01 17:14:11.712192
732	Luxury	107	2025-04-01 17:14:11.712192
733	Standard	107	2025-04-01 17:14:11.712192
734	Model 1	108	2025-04-01 17:14:11.712192
735	Model 2	108	2025-04-01 17:14:11.712192
736	Model 3	108	2025-04-01 17:14:11.712192
737	Premium	108	2025-04-01 17:14:11.712192
738	Sport	108	2025-04-01 17:14:11.712192
739	Luxury	108	2025-04-01 17:14:11.712192
740	Standard	108	2025-04-01 17:14:11.712192
741	R1T	109	2025-04-01 17:14:11.712192
742	R1S	109	2025-04-01 17:14:11.712192
743	Model 1	110	2025-04-01 17:14:11.712192
744	Model 2	110	2025-04-01 17:14:11.712192
745	Model 3	110	2025-04-01 17:14:11.712192
746	Premium	110	2025-04-01 17:14:11.712192
747	Sport	110	2025-04-01 17:14:11.712192
748	Luxury	110	2025-04-01 17:14:11.712192
749	Standard	110	2025-04-01 17:14:11.712192
750	Model 1	111	2025-04-01 17:14:11.712192
751	Model 2	111	2025-04-01 17:14:11.712192
752	Model 3	111	2025-04-01 17:14:11.712192
753	Premium	111	2025-04-01 17:14:11.712192
754	Sport	111	2025-04-01 17:14:11.712192
755	Luxury	111	2025-04-01 17:14:11.712192
756	Standard	111	2025-04-01 17:14:11.712192
757	Range Rover	112	2025-04-01 17:14:11.712192
758	Range Rover Sport	112	2025-04-01 17:14:11.712192
759	Discovery	112	2025-04-01 17:14:11.712192
760	Defender	112	2025-04-01 17:14:11.712192
761	Evoque	112	2025-04-01 17:14:11.712192
762	Velar	112	2025-04-01 17:14:11.712192
763	Model 1	113	2025-04-01 17:14:11.712192
764	Model 2	113	2025-04-01 17:14:11.712192
765	Model 3	113	2025-04-01 17:14:11.712192
766	Premium	113	2025-04-01 17:14:11.712192
767	Sport	113	2025-04-01 17:14:11.712192
768	Luxury	113	2025-04-01 17:14:11.712192
769	Standard	113	2025-04-01 17:14:11.712192
770	Model 1	114	2025-04-01 17:14:11.712192
771	Model 2	114	2025-04-01 17:14:11.712192
772	Model 3	114	2025-04-01 17:14:11.712192
773	Premium	114	2025-04-01 17:14:11.712192
774	Sport	114	2025-04-01 17:14:11.712192
775	Luxury	114	2025-04-01 17:14:11.712192
776	Standard	114	2025-04-01 17:14:11.712192
777	Model 1	115	2025-04-01 17:14:11.712192
778	Model 2	115	2025-04-01 17:14:11.712192
779	Model 3	115	2025-04-01 17:14:11.712192
780	Premium	115	2025-04-01 17:14:11.712192
781	Sport	115	2025-04-01 17:14:11.712192
782	Luxury	115	2025-04-01 17:14:11.712192
783	Standard	115	2025-04-01 17:14:11.712192
784	Model 1	116	2025-04-01 17:14:11.712192
785	Model 2	116	2025-04-01 17:14:11.712192
786	Model 3	116	2025-04-01 17:14:11.712192
787	Premium	116	2025-04-01 17:14:11.712192
788	Sport	116	2025-04-01 17:14:11.712192
789	Luxury	116	2025-04-01 17:14:11.712192
790	Standard	116	2025-04-01 17:14:11.712192
791	Model 1	117	2025-04-01 17:14:11.712192
792	Model 2	117	2025-04-01 17:14:11.712192
793	Model 3	117	2025-04-01 17:14:11.712192
794	Premium	117	2025-04-01 17:14:11.712192
795	Sport	117	2025-04-01 17:14:11.712192
796	Luxury	117	2025-04-01 17:14:11.712192
797	Standard	117	2025-04-01 17:14:11.712192
798	Model 1	118	2025-04-01 17:14:11.712192
799	Model 2	118	2025-04-01 17:14:11.712192
800	Model 3	118	2025-04-01 17:14:11.712192
801	Premium	118	2025-04-01 17:14:11.712192
802	Sport	118	2025-04-01 17:14:11.712192
803	Luxury	118	2025-04-01 17:14:11.712192
804	Standard	118	2025-04-01 17:14:11.712192
805	Model 1	119	2025-04-01 17:14:11.712192
806	Model 2	119	2025-04-01 17:14:11.712192
807	Model 3	119	2025-04-01 17:14:11.712192
808	Premium	119	2025-04-01 17:14:11.712192
809	Sport	119	2025-04-01 17:14:11.712192
810	Luxury	119	2025-04-01 17:14:11.712192
811	Standard	119	2025-04-01 17:14:11.712192
812	Model 1	120	2025-04-01 17:14:11.712192
813	Model 2	120	2025-04-01 17:14:11.712192
814	Model 3	120	2025-04-01 17:14:11.712192
815	Premium	120	2025-04-01 17:14:11.712192
816	Sport	120	2025-04-01 17:14:11.712192
817	Luxury	120	2025-04-01 17:14:11.712192
818	Standard	120	2025-04-01 17:14:11.712192
819	Model 1	121	2025-04-01 17:14:11.712192
820	Model 2	121	2025-04-01 17:14:11.712192
821	Model 3	121	2025-04-01 17:14:11.712192
822	Premium	121	2025-04-01 17:14:11.712192
823	Sport	121	2025-04-01 17:14:11.712192
824	Luxury	121	2025-04-01 17:14:11.712192
825	Standard	121	2025-04-01 17:14:11.712192
826	Model 1	122	2025-04-01 17:14:11.712192
827	Model 2	122	2025-04-01 17:14:11.712192
828	Model 3	122	2025-04-01 17:14:11.712192
829	Premium	122	2025-04-01 17:14:11.712192
830	Sport	122	2025-04-01 17:14:11.712192
831	Luxury	122	2025-04-01 17:14:11.712192
832	Standard	122	2025-04-01 17:14:11.712192
833	Model 1	123	2025-04-01 17:14:11.712192
834	Model 2	123	2025-04-01 17:14:11.712192
835	Model 3	123	2025-04-01 17:14:11.712192
836	Premium	123	2025-04-01 17:14:11.712192
837	Sport	123	2025-04-01 17:14:11.712192
838	Luxury	123	2025-04-01 17:14:11.712192
839	Standard	123	2025-04-01 17:14:11.712192
840	Outback	124	2025-04-01 17:14:11.712192
841	Forester	124	2025-04-01 17:14:11.712192
842	Crosstrek	124	2025-04-01 17:14:11.712192
843	Impreza	124	2025-04-01 17:14:11.712192
844	Legacy	124	2025-04-01 17:14:11.712192
845	Ascent	124	2025-04-01 17:14:11.712192
846	WRX	124	2025-04-01 17:14:11.712192
847	BRZ	124	2025-04-01 17:14:11.712192
848	Swift	125	2025-04-01 17:14:11.712192
849	Vitara	125	2025-04-01 17:14:11.712192
850	Jimny	125	2025-04-01 17:14:11.712192
851	S-Cross	125	2025-04-01 17:14:11.712192
852	Ignis	125	2025-04-01 17:14:11.712192
853	Model 1	126	2025-04-01 17:14:11.712192
854	Model 2	126	2025-04-01 17:14:11.712192
855	Model 3	126	2025-04-01 17:14:11.712192
856	Premium	126	2025-04-01 17:14:11.712192
857	Sport	126	2025-04-01 17:14:11.712192
858	Luxury	126	2025-04-01 17:14:11.712192
859	Standard	126	2025-04-01 17:14:11.712192
860	Model S	127	2025-04-01 17:14:11.712192
861	Model 3	127	2025-04-01 17:14:11.712192
862	Model X	127	2025-04-01 17:14:11.712192
863	Model Y	127	2025-04-01 17:14:11.712192
864	Cybertruck	127	2025-04-01 17:14:11.712192
865	Model 1	129	2025-04-01 17:14:11.712192
866	Model 2	129	2025-04-01 17:14:11.712192
867	Model 3	129	2025-04-01 17:14:11.712192
868	Premium	129	2025-04-01 17:14:11.712192
869	Sport	129	2025-04-01 17:14:11.712192
870	Luxury	129	2025-04-01 17:14:11.712192
871	Standard	129	2025-04-01 17:14:11.712192
872	Model 1	130	2025-04-01 17:14:11.712192
873	Model 2	130	2025-04-01 17:14:11.712192
874	Model 3	130	2025-04-01 17:14:11.712192
875	Premium	130	2025-04-01 17:14:11.712192
876	Sport	130	2025-04-01 17:14:11.712192
877	Luxury	130	2025-04-01 17:14:11.712192
878	Standard	130	2025-04-01 17:14:11.712192
879	Model 1	131	2025-04-01 17:14:11.712192
880	Model 2	131	2025-04-01 17:14:11.712192
881	Model 3	131	2025-04-01 17:14:11.712192
882	Premium	131	2025-04-01 17:14:11.712192
883	Sport	131	2025-04-01 17:14:11.712192
884	Luxury	131	2025-04-01 17:14:11.712192
885	Standard	131	2025-04-01 17:14:11.712192
886	Golf	132	2025-04-01 17:14:11.712192
887	Passat	132	2025-04-01 17:14:11.712192
888	Tiguan	132	2025-04-01 17:14:11.712192
889	Atlas	132	2025-04-01 17:14:11.712192
890	Jetta	132	2025-04-01 17:14:11.712192
891	Arteon	132	2025-04-01 17:14:11.712192
892	ID.4	132	2025-04-01 17:14:11.712192
893	Taos	132	2025-04-01 17:14:11.712192
894	GTI	132	2025-04-01 17:14:11.712192
895	XC90	133	2025-04-01 17:14:11.712192
896	XC60	133	2025-04-01 17:14:11.712192
897	XC40	133	2025-04-01 17:14:11.712192
898	S60	133	2025-04-01 17:14:11.712192
899	S90	133	2025-04-01 17:14:11.712192
900	V60	133	2025-04-01 17:14:11.712192
901	V90	133	2025-04-01 17:14:11.712192
902	Model 1	134	2025-04-01 17:14:11.712192
903	Model 2	134	2025-04-01 17:14:11.712192
904	Model 3	134	2025-04-01 17:14:11.712192
905	Premium	134	2025-04-01 17:14:11.712192
906	Sport	134	2025-04-01 17:14:11.712192
907	Luxury	134	2025-04-01 17:14:11.712192
908	Standard	134	2025-04-01 17:14:11.712192
909	Model 1	135	2025-04-01 17:14:11.712192
910	Model 2	135	2025-04-01 17:14:11.712192
911	Model 3	135	2025-04-01 17:14:11.712192
912	Premium	135	2025-04-01 17:14:11.712192
913	Sport	135	2025-04-01 17:14:11.712192
914	Luxury	135	2025-04-01 17:14:11.712192
915	Standard	135	2025-04-01 17:14:11.712192
916	Model 1	136	2025-04-01 17:14:11.712192
917	Model 2	136	2025-04-01 17:14:11.712192
918	Model 3	136	2025-04-01 17:14:11.712192
919	Premium	136	2025-04-01 17:14:11.712192
920	Sport	136	2025-04-01 17:14:11.712192
921	Luxury	136	2025-04-01 17:14:11.712192
922	Standard	136	2025-04-01 17:14:11.712192
923	Model 1	137	2025-04-01 17:14:11.712192
924	Model 2	137	2025-04-01 17:14:11.712192
925	Model 3	137	2025-04-01 17:14:11.712192
926	Premium	137	2025-04-01 17:14:11.712192
927	Sport	137	2025-04-01 17:14:11.712192
928	Luxury	137	2025-04-01 17:14:11.712192
929	Standard	137	2025-04-01 17:14:11.712192
930	Model 1	138	2025-04-01 17:14:11.712192
931	Model 2	138	2025-04-01 17:14:11.712192
932	Model 3	138	2025-04-01 17:14:11.712192
933	Premium	138	2025-04-01 17:14:11.712192
934	Sport	138	2025-04-01 17:14:11.712192
935	Luxury	138	2025-04-01 17:14:11.712192
936	Standard	138	2025-04-01 17:14:11.712192
937	Model 1	139	2025-04-01 17:14:11.712192
938	Model 2	139	2025-04-01 17:14:11.712192
939	Model 3	139	2025-04-01 17:14:11.712192
940	Premium	139	2025-04-01 17:14:11.712192
941	Sport	139	2025-04-01 17:14:11.712192
942	Luxury	139	2025-04-01 17:14:11.712192
943	Standard	139	2025-04-01 17:14:11.712192
944	Model 1	140	2025-04-01 17:14:11.712192
945	Model 2	140	2025-04-01 17:14:11.712192
946	Model 3	140	2025-04-01 17:14:11.712192
947	Premium	140	2025-04-01 17:14:11.712192
948	Sport	140	2025-04-01 17:14:11.712192
949	Luxury	140	2025-04-01 17:14:11.712192
950	Standard	140	2025-04-01 17:14:11.712192
951	Model 1	141	2025-04-01 17:14:11.712192
952	Model 2	141	2025-04-01 17:14:11.712192
953	Model 3	141	2025-04-01 17:14:11.712192
954	Premium	141	2025-04-01 17:14:11.712192
955	Sport	141	2025-04-01 17:14:11.712192
956	Luxury	141	2025-04-01 17:14:11.712192
957	Standard	141	2025-04-01 17:14:11.712192
958	Model 1	142	2025-04-01 17:14:11.712192
959	Model 2	142	2025-04-01 17:14:11.712192
960	Model 3	142	2025-04-01 17:14:11.712192
961	Premium	142	2025-04-01 17:14:11.712192
962	Sport	142	2025-04-01 17:14:11.712192
963	Luxury	142	2025-04-01 17:14:11.712192
964	Standard	142	2025-04-01 17:14:11.712192
965	Model 1	143	2025-04-01 17:14:11.712192
966	Model 2	143	2025-04-01 17:14:11.712192
967	Model 3	143	2025-04-01 17:14:11.712192
968	Premium	143	2025-04-01 17:14:11.712192
969	Sport	143	2025-04-01 17:14:11.712192
970	Luxury	143	2025-04-01 17:14:11.712192
971	Standard	143	2025-04-01 17:14:11.712192
\.


--
-- Data for Name: specifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.specifications (id, engine_type, transmission, fuel_type, mileage, mileage_unit, engine_size, horsepower, is_turbo, cylinders, manufacture_month, color, body_type, steering_wheel, drive_type, has_catalyst, airbags_count, interior_material, interior_color, created_at, doors, has_hydraulics, has_board_computer, has_air_conditioning, has_parking_control, has_rear_view_camera, has_electric_windows, has_climate_control, has_cruise_control, has_start_stop, has_sunroof, has_seat_heating, has_seat_memory, has_abs, has_traction_control, has_central_locking, has_alarm, has_fog_lights, has_navigation, has_aux, has_bluetooth, has_multifunction_steering_wheel, has_alloy_wheels, has_spare_tire, is_disability_adapted, is_cleared, has_technical_inspection, clearance_status) FROM stdin;
73	gasoline	\N	ბენზინი	78000	km	2.00	\N	f	4	1	შავი	sedan	\N	rear	t	4	ტყავი	შავი	2025-04-02 15:02:10.650188	\N	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	not_cleared
75	gasoline	\N	ბენზინი	70000	km	2.00	\N	f	4	1	შავი	sedan	\N	rear	t	4	ტყავი	შავი	2025-04-02 16:05:39.767615	\N	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	not_cleared
76	gasoline	\N	ბენზინი	45670	km	0.20	\N	f	4	1	\N	სედანი	\N	rear	t	0	ნაჭერი	black	2025-04-02 16:51:31.166542	\N	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	not_cleared
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password, first_name, last_name, age, gender, phone, role, created_at) FROM stdin;
1	dealer1	dealer1@bigway.com	$2b$10$/id1Ay6Ly/MVY3MHAL2vz.BJ7J.xw09E3Nb95RgfFlcAnTb6x.Li.	David	Brown	35	male	+995599333333	user	2025-03-10 16:16:23.633315
2	admin	admin@bigway.com	$2b$10$9FMkLnoynvGrt1q9HhTy.ew9fCNvL3ZDRmkmvwsu0C3wKA4OHnnUq	Admin	User	30	male	+995599000000	admin	2025-03-10 16:16:23.633315
3	johndoe	john@example.com	$2b$10$Tyb6EDq.VFOkHRjT/Rf6DeQZpcIeXyz..FvPzBYqF/ihV/K1px5Na	John	Doe	25	male	+995599111111	user	2025-03-10 16:16:23.633315
4	janesmith	jane@example.com	$2b$10$p2sL.iJ1BcsGLE3EQWvrKOK04dR95XUHYIk3DgabdexuMTrCVSv2W	Jane	Smith	28	female	+995599222222	user	2025-03-10 16:16:23.633315
5	dealer2	dealer2@bigway.com	$2b$10$eO93v9mrPUWajE3/n7WnYuemLVbpnbZXNAxkqDPKTPGqVBDwraYZy	Sarah	Wilson	32	female	+995599444444	user	2025-03-10 16:16:23.633315
6	beka chkhirodze	bekachkhirodze1@gmail.com	$2b$10$Xc6oB8ACdBQBCKfw0B7J/umJME9.SRmXFT2oOmL3LuMZx6LcLRhfe	beka	chkhirodze	19	male	+995557409798	user	2025-03-14 18:01:32.363966
7	beka1 chkhirodze	beqachxirodze@gmail.com	$2b$10$L2nQVrYDW/glsOJH2p32wuNiCdBjR6pnHip4PSniqa4HivZRCF7WS	beka1	chkhirodze	19	male	+995557409798	user	2025-03-25 17:33:03.594969
\.


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wishlists (id, user_id, car_id, created_at) FROM stdin;
\.


--
-- Name: brands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.brands_id_seq', 572, true);


--
-- Name: car_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.car_images_id_seq', 17, true);


--
-- Name: car_models_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.car_models_id_seq', 1105, true);


--
-- Name: cars_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cars_id_seq', 16, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 10, true);


--
-- Name: door_counts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.door_counts_id_seq', 3, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.locations_id_seq', 18, true);


--
-- Name: models_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.models_id_seq', 971, true);


--
-- Name: specifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.specifications_id_seq', 76, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: wishlists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wishlists_id_seq', 4, true);


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

