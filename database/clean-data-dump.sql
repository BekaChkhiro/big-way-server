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
SELECT pg_catalog.set_config('search_path', '');
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.brands (id, name, created_at) VALUES (1, 'Acura', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (2, 'Aion', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (3, 'AIQAR', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (4, 'Alfa Romeo', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (5, 'AMC', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (6, 'Arcfox', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (7, 'Aston Martin', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (8, 'Audi', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (9, 'Avatr', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (10, 'Baic', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (11, 'Bentley', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (12, 'BMW', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (13, 'Brilliance', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (14, 'Bugatti', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (15, 'Buick', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (16, 'BYD', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (17, 'Cadillac', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (18, 'Changan', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (19, 'Changfeng', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (20, 'Chery', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (21, 'Chevrolet', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (22, 'Chrysler', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (23, 'Citroen', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (24, 'CPI', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (25, 'Dacia', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (26, 'Daewoo', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (27, 'Daihatsu', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (28, 'Datsun', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (29, 'Dayun', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (30, 'DM Telai', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (31, 'Dodge', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (32, 'Dongfeng', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (33, 'DS Automobiles', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (34, 'Exeed', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (35, 'FAW', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (36, 'Ferrari', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (37, 'Fiat', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (38, 'Fisker', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (39, 'Ford', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (40, 'Forthing', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (41, 'Fortschritt', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (42, 'Foton', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (43, 'GAZ', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (44, 'Geely', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (45, 'Genesis', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (46, 'GMC', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (47, 'Gonow', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (48, 'Great Wall', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (49, 'Hafei', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (50, 'Haval', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (51, 'Hiphi', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (52, 'Honda', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (53, 'Hongqi', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (54, 'Huawei', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (55, 'Huawei Inside', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (56, 'Hummer', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (57, 'Hyster', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (58, 'Hyundai', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (59, 'IM Motors', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (60, 'Infiniti', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (61, 'Iran Khodro', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (62, 'Isuzu', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (63, 'Iveco', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (64, 'Izh', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (65, 'JAC', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (66, 'Jaguar', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (67, 'Jeep', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (68, 'Jetour', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (69, 'Karsan', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (70, 'Kia', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (71, 'Lamborghini', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (72, 'Lancia', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (73, 'Land Rover', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (74, 'Leap Motor', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (75, 'Lexus', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (76, 'Lifan', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (77, 'Lincoln', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (78, 'Linde', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (79, 'Lixiang', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (80, 'Lonking', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (81, 'Lotus', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (82, 'LTI', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (83, 'Lynk & Co', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (84, 'Maserati', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (85, 'Maybach', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (86, 'Mazda', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (87, 'McLaren', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (88, 'Mercedes-Benz', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (89, 'Mercury', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (90, 'MG', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (91, 'Mini', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (92, 'Mitsubishi', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (93, 'Mitsuoka', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (94, 'Moskvich', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (95, 'MPM', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (96, 'Neta', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (97, 'Niewiadow', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (98, 'NIO', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (99, 'Nissan', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (100, 'Oldsmobile', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (101, 'Opel', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (102, 'Peugeot', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (103, 'Polestar', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (104, 'Pontiac', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (105, 'Porsche', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (106, 'Proton', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (107, 'Renault', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (108, 'Renault Samsung', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (109, 'Rivian', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (110, 'Roewe', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (111, 'Rolls-Royce', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (112, 'Rover', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (113, 'Saab', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (114, 'Saleen', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (115, 'Saturn', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (116, 'Scion', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (117, 'Seat', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (118, 'Sena', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (119, 'Skoda', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (120, 'Skywell', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (121, 'Smart', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (122, 'Soueast', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (123, 'Ssangyong', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (124, 'Subaru', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (125, 'Suzuki', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (126, 'Tata', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (127, 'Tesla', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (128, 'Toyota', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (129, 'UAZ', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (130, 'Vauxhall', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (131, 'VAZ', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (132, 'Volkswagen', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (133, 'Volvo', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (134, 'Voyah', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (135, 'Xiaomi', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (136, 'Xingtai', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (137, 'Xpeng', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (138, 'YTO', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (139, 'Yuanxin Energy''s', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (140, 'ZAZ', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (141, 'Zeekr', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (142, 'Zukida', '2025-03-10 16:16:23.633315');
INSERT INTO public.brands (id, name, created_at) VALUES (143, 'Zxauto', '2025-03-10 16:16:23.633315');


--
-- Data for Name: door_counts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.door_counts (id, value) VALUES (1, '2/3');
INSERT INTO public.door_counts (id, value) VALUES (2, '4/5');
INSERT INTO public.door_counts (id, value) VALUES (3, '>5');


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.locations (id, city, state, country, created_at, is_in_transit, location_type) VALUES (15, 'თბილისი', '', 'საქართველო', '2025-04-02 15:02:10.650188', NULL);


--
-- Data for Name: specifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.specifications (id, engine_type, transmission, fuel_type, mileage, mileage_unit, engine_size, horsepower, is_turbo, cylinders, manufacture_month, color, body_type, steering_wheel, drive_type, has_catalyst, airbags_count, interior_material, interior_color, created_at, doors, has_hydraulics, has_board_computer, has_air_conditioning, has_parking_control, has_rear_view_camera, has_electric_windows, has_climate_control, has_cruise_control, has_start_stop, has_sunroof, has_seat_heating, has_seat_memory, has_abs, has_traction_control, has_central_locking, has_alarm, has_fog_lights, has_navigation, has_aux, has_bluetooth, has_multifunction_steering_wheel, has_alloy_wheels, has_spare_tire, is_disability_adapted, is_cleared, has_technical_inspection, clearance_status) VALUES (73, 'gasoline', NULL, 'ბენზინი', 78000, 'km', 2.00, NULL, 4, 1, 'შავი', 'sedan', NULL, 'rear', 4, 'ტყავი', 'შავი', '2025-04-02 15:02:10.650188', NULL, 'not_cleared');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, username, email, password, first_name, last_name, age, gender, phone, role, created_at) VALUES (1, 'dealer1', 'dealer1@bigway.com', '$2b$10$/id1Ay6Ly/MVY3MHAL2vz.BJ7J.xw09E3Nb95RgfFlcAnTb6x.Li.', 'David', 'Brown', 35, 'male', '+995599333333', 'user', '2025-03-10 16:16:23.633315');
INSERT INTO public.users (id, username, email, password, first_name, last_name, age, gender, phone, role, created_at) VALUES (2, 'admin', 'admin@bigway.com', '$2b$10$9FMkLnoynvGrt1q9HhTy.ew9fCNvL3ZDRmkmvwsu0C3wKA4OHnnUq', 'Admin', 'User', 30, 'male', '+995599000000', 'admin', '2025-03-10 16:16:23.633315');
INSERT INTO public.users (id, username, email, password, first_name, last_name, age, gender, phone, role, created_at) VALUES (3, 'johndoe', 'john@example.com', '$2b$10$Tyb6EDq.VFOkHRjT/Rf6DeQZpcIeXyz..FvPzBYqF/ihV/K1px5Na', 'John', 'Doe', 25, 'male', '+995599111111', 'user', '2025-03-10 16:16:23.633315');
INSERT INTO public.users (id, username, email, password, first_name, last_name, age, gender, phone, role, created_at) VALUES (4, 'janesmith', 'jane@example.com', '$2b$10$p2sL.iJ1BcsGLE3EQWvrKOK04dR95XUHYIk3DgabdexuMTrCVSv2W', 'Jane', 'Smith', 28, 'female', '+995599222222', 'user', '2025-03-10 16:16:23.633315');
INSERT INTO public.users (id, username, email, password, first_name, last_name, age, gender, phone, role, created_at) VALUES (5, 'dealer2', 'dealer2@bigway.com', '$2b$10$eO93v9mrPUWajE3/n7WnYuemLVbpnbZXNAxkqDPKTPGqVBDwraYZy', 'Sarah', 'Wilson', 32, 'female', '+995599444444', 'user', '2025-03-10 16:16:23.633315');
INSERT INTO public.users (id, username, email, password, first_name, last_name, age, gender, phone, role, created_at) VALUES (6, 'beka chkhirodze', 'bekachkhirodze1@gmail.com', '$2b$10$Xc6oB8ACdBQBCKfw0B7J/umJME9.SRmXFT2oOmL3LuMZx6LcLRhfe', 'beka', 'chkhirodze', 19, 'male', '+995557409798', 'user', '2025-03-14 18:01:32.363966');
INSERT INTO public.users (id, username, email, password, first_name, last_name, age, gender, phone, role, created_at) VALUES (7, 'beka1 chkhirodze', 'beqachxirodze@gmail.com', '$2b$10$L2nQVrYDW/glsOJH2p32wuNiCdBjR6pnHip4PSniqa4HivZRCF7WS', 'beka1', 'chkhirodze', 19, 'male', '+995557409798', 'user', '2025-03-25 17:33:03.594969');


--
-- Data for Name: cars; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, description, status, featured, seller_id, views_count, created_at, updated_at, search_vector, description_ka, description_en, description_ru) VALUES (13, 4, 1, 15, 73, 'Giulia', 2022, 77998.00, NULL, 'available', 3, 0, '2025-04-02 15:02:10.650188', '2025-04-02 15:02:10.650188', '''alfa'':2A ''giulia'':1A ''romeo'':3A', 'კარგი მანქანაა', 'კარგი მანქანაა', 'კარგი მანქანაა');


--
-- Data for Name: car_images; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.car_images (id, car_id, image_url, thumbnail_url, medium_url, large_url, is_primary, created_at) VALUES (14, 13, 'https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/original/1743591729266-23790855ff401e6bc944bdaafd40c71faad51a20jpeg.webp', 'https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/thumbnail/1743591729266-23790855ff401e6bc944bdaafd40c71faad51a20jpeg.webp', 'https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/medium/1743591729266-23790855ff401e6bc944bdaafd40c71faad51a20jpeg.webp', 'https://big-way-uploads.s3.eu-north-1.amazonaws.com/images/large/1743591729266-23790855ff401e6bc944bdaafd40c71faad51a20jpeg.webp', '2025-04-02 15:02:10.650188');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categories (id, name, created_at) VALUES (11, 'Excavator', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (12, 'Bulldozer', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (13, 'Crane', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (14, 'Forklift', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (15, 'Tractor', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (16, 'Loader', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (17, 'Dump Truck', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (18, 'Concrete Mixer', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (19, 'Sport Bike', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (20, 'Cruiser', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (21, 'Touring', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (22, 'Adventure', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (23, 'Scooter', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (24, 'Dirt Bike', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (25, 'Chopper', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (26, 'Electric Motorcycle', '2025-03-10 16:16:23.633315');
INSERT INTO public.categories (id, name, created_at) VALUES (1, 'სედანი', '2025-03-19 17:55:50.201229');
INSERT INTO public.categories (id, name, created_at) VALUES (2, 'ჯიპი', '2025-03-19 17:55:50.20182');
INSERT INTO public.categories (id, name, created_at) VALUES (3, 'კუპე', '2025-03-19 17:55:50.202265');
INSERT INTO public.categories (id, name, created_at) VALUES (4, 'ჰეტჩბექი', '2025-03-19 17:55:50.202708');
INSERT INTO public.categories (id, name, created_at) VALUES (5, 'უნივერსალი', '2025-03-19 17:55:50.213488');
INSERT INTO public.categories (id, name, created_at) VALUES (6, 'კაბრიოლეტი', '2025-03-19 17:55:50.214146');
INSERT INTO public.categories (id, name, created_at) VALUES (7, 'პიკაპი', '2025-03-19 17:55:50.214694');
INSERT INTO public.categories (id, name, created_at) VALUES (8, 'მინივენი', '2025-03-19 17:55:50.215231');
INSERT INTO public.categories (id, name, created_at) VALUES (9, 'ლიმუზინი', '2025-03-19 17:55:50.215767');
INSERT INTO public.categories (id, name, created_at) VALUES (10, 'კროსოვერი', '2025-03-19 17:55:50.216407');


--
-- Data for Name: models; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.models (id, name, brand_id, created_at) VALUES (1, 'A3', 8, '2025-04-01 17:04:30.811479');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (2, 'A4', 8, '2025-04-01 17:04:30.811479');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (3, 'A6', 8, '2025-04-01 17:04:30.811479');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (4, 'A8', 8, '2025-04-01 17:04:30.811479');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (5, 'Q3', 8, '2025-04-01 17:04:30.811479');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (6, 'Q5', 8, '2025-04-01 17:04:30.811479');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (7, 'Q7', 8, '2025-04-01 17:04:30.811479');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (8, 'e-tron', 8, '2025-04-01 17:04:30.811479');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (9, 'RS6', 8, '2025-04-01 17:04:30.811479');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (10, 'TT', 8, '2025-04-01 17:04:30.811479');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (11, '3 Series', 12, '2025-04-01 17:04:30.820519');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (12, '5 Series', 12, '2025-04-01 17:04:30.820519');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (13, '7 Series', 12, '2025-04-01 17:04:30.820519');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (14, 'X3', 12, '2025-04-01 17:04:30.820519');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (15, 'X5', 12, '2025-04-01 17:04:30.820519');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (16, 'X7', 12, '2025-04-01 17:04:30.820519');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (17, 'M3', 12, '2025-04-01 17:04:30.820519');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (18, 'M5', 12, '2025-04-01 17:04:30.820519');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (19, 'i4', 12, '2025-04-01 17:04:30.820519');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (20, 'iX', 12, '2025-04-01 17:04:30.820519');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (21, 'C-Class', 88, '2025-04-01 17:04:30.821862');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (22, 'E-Class', 88, '2025-04-01 17:04:30.821862');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (23, 'S-Class', 88, '2025-04-01 17:04:30.821862');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (24, 'GLC', 88, '2025-04-01 17:04:30.821862');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (25, 'GLE', 88, '2025-04-01 17:04:30.821862');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (26, 'GLS', 88, '2025-04-01 17:04:30.821862');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (27, 'A-Class', 88, '2025-04-01 17:04:30.821862');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (28, 'CLA', 88, '2025-04-01 17:04:30.821862');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (29, 'AMG GT', 88, '2025-04-01 17:04:30.821862');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (30, 'Camry', 128, '2025-04-01 17:04:30.823036');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (31, 'Corolla', 128, '2025-04-01 17:04:30.823036');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (32, 'RAV4', 128, '2025-04-01 17:04:30.823036');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (33, 'Land Cruiser', 128, '2025-04-01 17:04:30.823036');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (34, 'Prius', 128, '2025-04-01 17:04:30.823036');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (35, 'Highlander', 128, '2025-04-01 17:04:30.823036');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (36, 'Avalon', 128, '2025-04-01 17:04:30.823036');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (37, '4Runner', 128, '2025-04-01 17:04:30.823036');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (38, 'Tacoma', 128, '2025-04-01 17:04:30.823036');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (39, 'Tundra', 128, '2025-04-01 17:04:30.823036');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (40, 'Civic', 52, '2025-04-01 17:04:30.824119');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (41, 'Accord', 52, '2025-04-01 17:04:30.824119');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (42, 'CR-V', 52, '2025-04-01 17:04:30.824119');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (43, 'Pilot', 52, '2025-04-01 17:04:30.824119');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (44, 'HR-V', 52, '2025-04-01 17:04:30.824119');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (45, 'Odyssey', 52, '2025-04-01 17:04:30.824119');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (46, 'Ridgeline', 52, '2025-04-01 17:04:30.824119');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (47, 'Passport', 52, '2025-04-01 17:04:30.824119');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (48, 'Insight', 52, '2025-04-01 17:04:30.824119');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (49, 'F-150', 39, '2025-04-01 17:04:30.824957');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (50, 'Mustang', 39, '2025-04-01 17:04:30.824957');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (51, 'Explorer', 39, '2025-04-01 17:04:30.824957');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (52, 'Escape', 39, '2025-04-01 17:04:30.824957');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (53, 'Edge', 39, '2025-04-01 17:04:30.824957');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (54, 'Ranger', 39, '2025-04-01 17:04:30.824957');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (55, 'Bronco', 39, '2025-04-01 17:04:30.824957');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (56, 'Expedition', 39, '2025-04-01 17:04:30.824957');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (57, 'Focus', 39, '2025-04-01 17:04:30.824957');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (58, 'Continental GT', 11, '2025-04-01 17:09:26.496767');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (59, 'Flying Spur', 11, '2025-04-01 17:09:26.496767');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (60, 'Bentayga', 11, '2025-04-01 17:09:26.496767');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (61, 'Bacalar', 11, '2025-04-01 17:09:26.496767');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (62, 'Mulliner', 11, '2025-04-01 17:09:26.496767');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (63, 'MDX', 1, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (64, 'RDX', 1, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (65, 'TLX', 1, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (66, 'ILX', 1, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (67, 'NSX', 1, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (68, 'RLX', 1, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (69, 'TL', 1, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (70, 'TSX', 1, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (71, 'Model 1', 2, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (72, 'Model 2', 2, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (73, 'Model 3', 2, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (74, 'Premium', 2, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (75, 'Sport', 2, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (76, 'Luxury', 2, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (77, 'Standard', 2, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (78, 'Model 1', 3, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (79, 'Model 2', 3, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (80, 'Model 3', 3, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (81, 'Premium', 3, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (82, 'Sport', 3, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (83, 'Luxury', 3, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (84, 'Standard', 3, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (85, 'Giulia', 4, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (86, 'Stelvio', 4, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (87, '4C', 4, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (88, 'Giulietta', 4, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (89, 'Tonale', 4, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (90, 'Model 1', 5, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (91, 'Model 2', 5, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (92, 'Model 3', 5, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (93, 'Premium', 5, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (94, 'Sport', 5, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (95, 'Luxury', 5, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (96, 'Standard', 5, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (97, 'Model 1', 6, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (98, 'Model 2', 6, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (99, 'Model 3', 6, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (100, 'Premium', 6, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (101, 'Sport', 6, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (102, 'Luxury', 6, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (103, 'Standard', 6, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (104, 'DB11', 7, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (105, 'Vantage', 7, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (106, 'DBS Superleggera', 7, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (107, 'DBX', 7, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (108, 'Model 1', 9, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (109, 'Model 2', 9, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (110, 'Model 3', 9, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (111, 'Premium', 9, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (112, 'Sport', 9, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (113, 'Luxury', 9, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (114, 'Standard', 9, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (115, 'Model 1', 10, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (116, 'Model 2', 10, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (117, 'Model 3', 10, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (118, 'Premium', 10, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (119, 'Sport', 10, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (120, 'Luxury', 10, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (121, 'Standard', 10, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (122, 'Model 1', 13, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (123, 'Model 2', 13, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (124, 'Model 3', 13, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (125, 'Premium', 13, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (126, 'Sport', 13, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (127, 'Luxury', 13, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (128, 'Standard', 13, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (129, 'Chiron', 14, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (130, 'Veyron', 14, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (131, 'Divo', 14, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (132, 'Centodieci', 14, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (133, 'Enclave', 15, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (134, 'Encore', 15, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (135, 'Envision', 15, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (136, 'LaCrosse', 15, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (137, 'Regal', 15, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (138, 'Model 1', 16, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (139, 'Model 2', 16, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (140, 'Model 3', 16, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (141, 'Premium', 16, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (142, 'Sport', 16, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (143, 'Luxury', 16, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (144, 'Standard', 16, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (145, 'Escalade', 17, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (146, 'CT4', 17, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (147, 'CT5', 17, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (148, 'XT4', 17, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (149, 'XT5', 17, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (150, 'XT6', 17, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (151, 'Model 1', 18, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (152, 'Model 2', 18, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (153, 'Model 3', 18, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (154, 'Premium', 18, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (155, 'Sport', 18, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (156, 'Luxury', 18, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (157, 'Standard', 18, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (158, 'Model 1', 19, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (159, 'Model 2', 19, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (160, 'Model 3', 19, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (161, 'Premium', 19, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (162, 'Sport', 19, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (163, 'Luxury', 19, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (164, 'Standard', 19, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (165, 'Model 1', 20, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (166, 'Model 2', 20, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (167, 'Model 3', 20, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (168, 'Premium', 20, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (169, 'Sport', 20, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (170, 'Luxury', 20, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (171, 'Standard', 20, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (172, 'Silverado', 21, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (173, 'Equinox', 21, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (174, 'Tahoe', 21, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (175, 'Traverse', 21, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (176, 'Malibu', 21, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (177, 'Camaro', 21, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (178, 'Suburban', 21, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (179, 'Colorado', 21, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (180, 'Blazer', 21, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (181, '300', 22, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (182, 'Pacifica', 22, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (183, 'Voyager', 22, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (184, 'Town & Country', 22, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (185, 'Model 1', 23, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (186, 'Model 2', 23, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (187, 'Model 3', 23, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (188, 'Premium', 23, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (189, 'Sport', 23, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (190, 'Luxury', 23, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (191, 'Standard', 23, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (192, 'Model 1', 24, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (193, 'Model 2', 24, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (194, 'Model 3', 24, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (195, 'Premium', 24, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (196, 'Sport', 24, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (197, 'Luxury', 24, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (198, 'Standard', 24, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (199, 'Model 1', 25, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (200, 'Model 2', 25, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (201, 'Model 3', 25, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (202, 'Premium', 25, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (203, 'Sport', 25, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (204, 'Luxury', 25, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (205, 'Standard', 25, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (206, 'Model 1', 26, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (207, 'Model 2', 26, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (208, 'Model 3', 26, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (209, 'Premium', 26, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (210, 'Sport', 26, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (211, 'Luxury', 26, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (212, 'Standard', 26, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (213, 'Model 1', 27, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (214, 'Model 2', 27, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (215, 'Model 3', 27, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (216, 'Premium', 27, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (217, 'Sport', 27, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (218, 'Luxury', 27, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (219, 'Standard', 27, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (220, 'Model 1', 28, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (221, 'Model 2', 28, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (222, 'Model 3', 28, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (223, 'Premium', 28, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (224, 'Sport', 28, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (225, 'Luxury', 28, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (226, 'Standard', 28, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (227, 'Model 1', 29, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (228, 'Model 2', 29, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (229, 'Model 3', 29, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (230, 'Premium', 29, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (231, 'Sport', 29, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (232, 'Luxury', 29, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (233, 'Standard', 29, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (234, 'Model 1', 30, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (235, 'Model 2', 30, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (236, 'Model 3', 30, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (237, 'Premium', 30, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (238, 'Sport', 30, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (239, 'Luxury', 30, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (240, 'Standard', 30, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (241, 'Challenger', 31, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (242, 'Charger', 31, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (243, 'Durango', 31, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (244, 'Journey', 31, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (245, 'Grand Caravan', 31, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (246, 'Model 1', 32, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (247, 'Model 2', 32, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (248, 'Model 3', 32, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (249, 'Premium', 32, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (250, 'Sport', 32, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (251, 'Luxury', 32, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (252, 'Standard', 32, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (253, 'Model 1', 33, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (254, 'Model 2', 33, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (255, 'Model 3', 33, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (256, 'Premium', 33, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (257, 'Sport', 33, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (258, 'Luxury', 33, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (259, 'Standard', 33, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (260, 'Model 1', 34, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (261, 'Model 2', 34, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (262, 'Model 3', 34, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (263, 'Premium', 34, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (264, 'Sport', 34, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (265, 'Luxury', 34, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (266, 'Standard', 34, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (267, 'Model 1', 35, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (268, 'Model 2', 35, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (269, 'Model 3', 35, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (270, 'Premium', 35, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (271, 'Sport', 35, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (272, 'Luxury', 35, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (273, 'Standard', 35, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (274, 'Roma', 36, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (275, 'Portofino', 36, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (276, 'SF90 Stradale', 36, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (277, 'F8 Tributo', 36, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (278, '812 Superfast', 36, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (279, '500', 37, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (280, '500X', 37, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (281, '500L', 37, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (282, '124 Spider', 37, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (283, 'Ocean', 38, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (284, 'Karma', 38, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (285, 'Model 1', 40, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (286, 'Model 2', 40, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (287, 'Model 3', 40, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (288, 'Premium', 40, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (289, 'Sport', 40, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (290, 'Luxury', 40, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (291, 'Standard', 40, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (292, 'Model 1', 41, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (293, 'Model 2', 41, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (294, 'Model 3', 41, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (295, 'Premium', 41, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (296, 'Sport', 41, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (297, 'Luxury', 41, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (298, 'Standard', 41, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (299, 'Model 1', 42, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (300, 'Model 2', 42, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (301, 'Model 3', 42, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (302, 'Premium', 42, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (303, 'Sport', 42, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (304, 'Luxury', 42, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (305, 'Standard', 42, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (306, 'Model 1', 43, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (307, 'Model 2', 43, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (308, 'Model 3', 43, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (309, 'Premium', 43, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (310, 'Sport', 43, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (311, 'Luxury', 43, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (312, 'Standard', 43, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (313, 'Model 1', 44, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (314, 'Model 2', 44, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (315, 'Model 3', 44, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (316, 'Premium', 44, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (317, 'Sport', 44, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (318, 'Luxury', 44, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (319, 'Standard', 44, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (320, 'G70', 45, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (321, 'G80', 45, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (322, 'G90', 45, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (323, 'GV70', 45, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (324, 'GV80', 45, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (325, 'Sierra', 46, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (326, 'Yukon', 46, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (327, 'Acadia', 46, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (328, 'Terrain', 46, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (329, 'Canyon', 46, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (330, 'Model 1', 47, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (331, 'Model 2', 47, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (332, 'Model 3', 47, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (333, 'Premium', 47, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (334, 'Sport', 47, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (335, 'Luxury', 47, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (336, 'Standard', 47, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (337, 'Model 1', 48, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (338, 'Model 2', 48, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (339, 'Model 3', 48, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (340, 'Premium', 48, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (341, 'Sport', 48, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (342, 'Luxury', 48, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (343, 'Standard', 48, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (344, 'Model 1', 49, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (345, 'Model 2', 49, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (346, 'Model 3', 49, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (347, 'Premium', 49, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (348, 'Sport', 49, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (349, 'Luxury', 49, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (350, 'Standard', 49, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (351, 'Model 1', 50, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (352, 'Model 2', 50, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (353, 'Model 3', 50, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (354, 'Premium', 50, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (355, 'Sport', 50, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (356, 'Luxury', 50, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (357, 'Standard', 50, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (358, 'Model 1', 51, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (359, 'Model 2', 51, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (360, 'Model 3', 51, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (361, 'Premium', 51, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (362, 'Sport', 51, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (363, 'Luxury', 51, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (364, 'Standard', 51, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (365, 'Model 1', 53, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (366, 'Model 2', 53, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (367, 'Model 3', 53, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (368, 'Premium', 53, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (369, 'Sport', 53, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (370, 'Luxury', 53, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (371, 'Standard', 53, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (372, 'Model 1', 54, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (373, 'Model 2', 54, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (374, 'Model 3', 54, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (375, 'Premium', 54, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (376, 'Sport', 54, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (377, 'Luxury', 54, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (378, 'Standard', 54, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (379, 'Model 1', 55, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (380, 'Model 2', 55, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (381, 'Model 3', 55, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (382, 'Premium', 55, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (383, 'Sport', 55, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (384, 'Luxury', 55, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (385, 'Standard', 55, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (386, 'Model 1', 56, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (387, 'Model 2', 56, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (388, 'Model 3', 56, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (389, 'Premium', 56, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (390, 'Sport', 56, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (391, 'Luxury', 56, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (392, 'Standard', 56, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (393, 'Model 1', 57, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (394, 'Model 2', 57, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (395, 'Model 3', 57, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (396, 'Premium', 57, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (397, 'Sport', 57, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (398, 'Luxury', 57, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (399, 'Standard', 57, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (400, 'Elantra', 58, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (401, 'Sonata', 58, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (402, 'Tucson', 58, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (403, 'Santa Fe', 58, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (404, 'Palisade', 58, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (405, 'Kona', 58, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (406, 'Venue', 58, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (407, 'Ioniq', 58, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (408, 'Model 1', 59, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (409, 'Model 2', 59, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (410, 'Model 3', 59, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (411, 'Premium', 59, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (412, 'Sport', 59, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (413, 'Luxury', 59, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (414, 'Standard', 59, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (415, 'Q50', 60, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (416, 'Q60', 60, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (417, 'QX50', 60, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (418, 'QX60', 60, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (419, 'QX80', 60, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (420, 'QX55', 60, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (421, 'QX30', 60, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (422, 'Model 1', 61, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (423, 'Model 2', 61, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (424, 'Model 3', 61, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (425, 'Premium', 61, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (426, 'Sport', 61, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (427, 'Luxury', 61, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (428, 'Standard', 61, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (429, 'Model 1', 62, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (430, 'Model 2', 62, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (431, 'Model 3', 62, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (432, 'Premium', 62, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (433, 'Sport', 62, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (434, 'Luxury', 62, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (435, 'Standard', 62, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (436, 'Model 1', 63, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (437, 'Model 2', 63, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (438, 'Model 3', 63, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (439, 'Premium', 63, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (440, 'Sport', 63, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (441, 'Luxury', 63, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (442, 'Standard', 63, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (443, 'Model 1', 64, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (444, 'Model 2', 64, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (445, 'Model 3', 64, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (446, 'Premium', 64, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (447, 'Sport', 64, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (448, 'Luxury', 64, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (449, 'Standard', 64, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (450, 'Model 1', 65, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (451, 'Model 2', 65, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (452, 'Model 3', 65, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (453, 'Premium', 65, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (454, 'Sport', 65, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (455, 'Luxury', 65, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (456, 'Standard', 65, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (457, 'F-PACE', 66, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (458, 'E-PACE', 66, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (459, 'I-PACE', 66, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (460, 'XE', 66, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (461, 'XF', 66, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (462, 'XJ', 66, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (463, 'F-TYPE', 66, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (464, 'Grand Cherokee', 67, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (465, 'Cherokee', 67, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (466, 'Wrangler', 67, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (467, 'Compass', 67, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (468, 'Renegade', 67, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (469, 'Gladiator', 67, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (470, 'Model 1', 68, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (471, 'Model 2', 68, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (472, 'Model 3', 68, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (473, 'Premium', 68, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (474, 'Sport', 68, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (475, 'Luxury', 68, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (476, 'Standard', 68, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (477, 'Model 1', 69, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (478, 'Model 2', 69, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (479, 'Model 3', 69, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (480, 'Premium', 69, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (481, 'Sport', 69, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (482, 'Luxury', 69, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (483, 'Standard', 69, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (484, 'Forte', 70, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (485, 'K5', 70, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (486, 'Sportage', 70, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (487, 'Telluride', 70, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (488, 'Sorento', 70, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (489, 'Soul', 70, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (490, 'Seltos', 70, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (491, 'Carnival', 70, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (492, 'Stinger', 70, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (493, 'Aventador', 71, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (494, 'Huracán', 71, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (495, 'Urus', 71, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (496, 'Model 1', 72, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (497, 'Model 2', 72, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (498, 'Model 3', 72, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (499, 'Premium', 72, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (500, 'Sport', 72, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (501, 'Luxury', 72, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (502, 'Standard', 72, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (503, 'Range Rover', 73, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (504, 'Range Rover Sport', 73, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (505, 'Discovery', 73, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (506, 'Defender', 73, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (507, 'Evoque', 73, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (508, 'Velar', 73, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (509, 'Model 1', 74, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (510, 'Model 2', 74, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (511, 'Model 3', 74, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (512, 'Premium', 74, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (513, 'Sport', 74, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (514, 'Luxury', 74, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (515, 'Standard', 74, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (516, 'ES', 75, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (517, 'LS', 75, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (518, 'RX', 75, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (519, 'NX', 75, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (520, 'UX', 75, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (521, 'IS', 75, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (522, 'GX', 75, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (523, 'LX', 75, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (524, 'RC', 75, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (525, 'LC', 75, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (526, 'Model 1', 76, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (527, 'Model 2', 76, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (528, 'Model 3', 76, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (529, 'Premium', 76, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (530, 'Sport', 76, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (531, 'Luxury', 76, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (532, 'Standard', 76, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (533, 'Navigator', 77, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (534, 'Aviator', 77, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (535, 'Nautilus', 77, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (536, 'Corsair', 77, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (537, 'Continental', 77, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (538, 'Model 1', 78, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (539, 'Model 2', 78, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (540, 'Model 3', 78, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (541, 'Premium', 78, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (542, 'Sport', 78, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (543, 'Luxury', 78, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (544, 'Standard', 78, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (545, 'Model 1', 79, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (546, 'Model 2', 79, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (547, 'Model 3', 79, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (548, 'Premium', 79, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (549, 'Sport', 79, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (550, 'Luxury', 79, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (551, 'Standard', 79, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (552, 'Model 1', 80, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (553, 'Model 2', 80, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (554, 'Model 3', 80, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (555, 'Premium', 80, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (556, 'Sport', 80, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (557, 'Luxury', 80, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (558, 'Standard', 80, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (559, 'Model 1', 81, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (560, 'Model 2', 81, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (561, 'Model 3', 81, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (562, 'Premium', 81, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (563, 'Sport', 81, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (564, 'Luxury', 81, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (565, 'Standard', 81, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (566, 'Model 1', 82, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (567, 'Model 2', 82, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (568, 'Model 3', 82, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (569, 'Premium', 82, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (570, 'Sport', 82, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (571, 'Luxury', 82, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (572, 'Standard', 82, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (573, 'Model 1', 83, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (574, 'Model 2', 83, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (575, 'Model 3', 83, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (576, 'Premium', 83, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (577, 'Sport', 83, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (578, 'Luxury', 83, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (579, 'Standard', 83, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (580, 'Ghibli', 84, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (581, 'Levante', 84, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (582, 'Quattroporte', 84, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (583, 'MC20', 84, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (584, 'GranTurismo', 84, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (585, 'Model 1', 85, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (586, 'Model 2', 85, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (587, 'Model 3', 85, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (588, 'Premium', 85, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (589, 'Sport', 85, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (590, 'Luxury', 85, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (591, 'Standard', 85, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (592, 'Mazda3', 86, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (593, 'Mazda6', 86, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (594, 'CX-5', 86, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (595, 'CX-9', 86, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (596, 'CX-30', 86, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (597, 'MX-5 Miata', 86, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (598, 'CX-3', 86, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (599, 'CX-50', 86, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (600, 'Model 1', 87, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (601, 'Model 2', 87, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (602, 'Model 3', 87, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (603, 'Premium', 87, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (604, 'Sport', 87, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (605, 'Luxury', 87, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (606, 'Standard', 87, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (607, 'Model 1', 89, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (608, 'Model 2', 89, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (609, 'Model 3', 89, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (610, 'Premium', 89, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (611, 'Sport', 89, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (612, 'Luxury', 89, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (613, 'Standard', 89, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (614, 'Model 1', 90, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (615, 'Model 2', 90, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (616, 'Model 3', 90, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (617, 'Premium', 90, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (618, 'Sport', 90, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (619, 'Luxury', 90, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (620, 'Standard', 90, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (621, 'Cooper', 91, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (622, 'Countryman', 91, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (623, 'Clubman', 91, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (624, 'Convertible', 91, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (625, 'Electric', 91, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (626, 'Outlander', 92, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (627, 'Eclipse Cross', 92, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (628, 'Mirage', 92, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (629, 'Outlander Sport', 92, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (630, 'Model 1', 93, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (631, 'Model 2', 93, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (632, 'Model 3', 93, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (633, 'Premium', 93, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (634, 'Sport', 93, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (635, 'Luxury', 93, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (636, 'Standard', 93, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (637, 'Model 1', 94, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (638, 'Model 2', 94, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (639, 'Model 3', 94, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (640, 'Premium', 94, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (641, 'Sport', 94, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (642, 'Luxury', 94, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (643, 'Standard', 94, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (644, 'Model 1', 95, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (645, 'Model 2', 95, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (646, 'Model 3', 95, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (647, 'Premium', 95, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (648, 'Sport', 95, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (649, 'Luxury', 95, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (650, 'Standard', 95, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (651, 'Model 1', 96, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (652, 'Model 2', 96, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (653, 'Model 3', 96, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (654, 'Premium', 96, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (655, 'Sport', 96, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (656, 'Luxury', 96, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (657, 'Standard', 96, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (658, 'Model 1', 97, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (659, 'Model 2', 97, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (660, 'Model 3', 97, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (661, 'Premium', 97, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (662, 'Sport', 97, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (663, 'Luxury', 97, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (664, 'Standard', 97, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (665, 'Model 1', 98, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (666, 'Model 2', 98, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (667, 'Model 3', 98, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (668, 'Premium', 98, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (669, 'Sport', 98, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (670, 'Luxury', 98, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (671, 'Standard', 98, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (672, 'Altima', 99, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (673, 'Maxima', 99, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (674, 'Sentra', 99, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (675, 'Rogue', 99, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (676, 'Pathfinder', 99, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (677, 'Murano', 99, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (678, 'Kicks', 99, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (679, 'Armada', 99, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (680, 'Titan', 99, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (681, '370Z', 99, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (682, 'Model 1', 100, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (683, 'Model 2', 100, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (684, 'Model 3', 100, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (685, 'Premium', 100, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (686, 'Sport', 100, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (687, 'Luxury', 100, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (688, 'Standard', 100, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (689, 'Model 1', 101, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (690, 'Model 2', 101, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (691, 'Model 3', 101, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (692, 'Premium', 101, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (693, 'Sport', 101, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (694, 'Luxury', 101, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (695, 'Standard', 101, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (696, 'Model 1', 102, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (697, 'Model 2', 102, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (698, 'Model 3', 102, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (699, 'Premium', 102, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (700, 'Sport', 102, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (701, 'Luxury', 102, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (702, 'Standard', 102, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (703, 'Polestar 1', 103, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (704, 'Polestar 2', 103, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (705, 'Polestar 3', 103, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (706, 'Model 1', 104, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (707, 'Model 2', 104, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (708, 'Model 3', 104, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (709, 'Premium', 104, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (710, 'Sport', 104, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (711, 'Luxury', 104, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (712, 'Standard', 104, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (713, '911', 105, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (714, 'Cayenne', 105, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (715, 'Panamera', 105, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (716, 'Macan', 105, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (717, 'Taycan', 105, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (718, 'Cayman', 105, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (719, 'Boxster', 105, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (720, 'Model 1', 106, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (721, 'Model 2', 106, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (722, 'Model 3', 106, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (723, 'Premium', 106, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (724, 'Sport', 106, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (725, 'Luxury', 106, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (726, 'Standard', 106, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (727, 'Model 1', 107, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (728, 'Model 2', 107, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (729, 'Model 3', 107, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (730, 'Premium', 107, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (731, 'Sport', 107, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (732, 'Luxury', 107, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (733, 'Standard', 107, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (734, 'Model 1', 108, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (735, 'Model 2', 108, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (736, 'Model 3', 108, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (737, 'Premium', 108, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (738, 'Sport', 108, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (739, 'Luxury', 108, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (740, 'Standard', 108, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (741, 'R1T', 109, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (742, 'R1S', 109, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (743, 'Model 1', 110, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (744, 'Model 2', 110, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (745, 'Model 3', 110, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (746, 'Premium', 110, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (747, 'Sport', 110, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (748, 'Luxury', 110, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (749, 'Standard', 110, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (750, 'Model 1', 111, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (751, 'Model 2', 111, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (752, 'Model 3', 111, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (753, 'Premium', 111, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (754, 'Sport', 111, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (755, 'Luxury', 111, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (756, 'Standard', 111, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (757, 'Range Rover', 112, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (758, 'Range Rover Sport', 112, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (759, 'Discovery', 112, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (760, 'Defender', 112, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (761, 'Evoque', 112, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (762, 'Velar', 112, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (763, 'Model 1', 113, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (764, 'Model 2', 113, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (765, 'Model 3', 113, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (766, 'Premium', 113, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (767, 'Sport', 113, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (768, 'Luxury', 113, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (769, 'Standard', 113, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (770, 'Model 1', 114, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (771, 'Model 2', 114, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (772, 'Model 3', 114, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (773, 'Premium', 114, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (774, 'Sport', 114, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (775, 'Luxury', 114, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (776, 'Standard', 114, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (777, 'Model 1', 115, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (778, 'Model 2', 115, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (779, 'Model 3', 115, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (780, 'Premium', 115, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (781, 'Sport', 115, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (782, 'Luxury', 115, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (783, 'Standard', 115, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (784, 'Model 1', 116, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (785, 'Model 2', 116, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (786, 'Model 3', 116, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (787, 'Premium', 116, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (788, 'Sport', 116, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (789, 'Luxury', 116, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (790, 'Standard', 116, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (791, 'Model 1', 117, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (792, 'Model 2', 117, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (793, 'Model 3', 117, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (794, 'Premium', 117, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (795, 'Sport', 117, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (796, 'Luxury', 117, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (797, 'Standard', 117, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (798, 'Model 1', 118, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (799, 'Model 2', 118, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (800, 'Model 3', 118, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (801, 'Premium', 118, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (802, 'Sport', 118, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (803, 'Luxury', 118, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (804, 'Standard', 118, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (805, 'Model 1', 119, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (806, 'Model 2', 119, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (807, 'Model 3', 119, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (808, 'Premium', 119, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (809, 'Sport', 119, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (810, 'Luxury', 119, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (811, 'Standard', 119, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (812, 'Model 1', 120, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (813, 'Model 2', 120, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (814, 'Model 3', 120, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (815, 'Premium', 120, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (816, 'Sport', 120, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (817, 'Luxury', 120, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (818, 'Standard', 120, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (819, 'Model 1', 121, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (820, 'Model 2', 121, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (821, 'Model 3', 121, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (822, 'Premium', 121, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (823, 'Sport', 121, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (824, 'Luxury', 121, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (825, 'Standard', 121, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (826, 'Model 1', 122, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (827, 'Model 2', 122, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (828, 'Model 3', 122, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (829, 'Premium', 122, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (830, 'Sport', 122, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (831, 'Luxury', 122, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (832, 'Standard', 122, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (833, 'Model 1', 123, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (834, 'Model 2', 123, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (835, 'Model 3', 123, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (836, 'Premium', 123, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (837, 'Sport', 123, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (838, 'Luxury', 123, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (839, 'Standard', 123, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (840, 'Outback', 124, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (841, 'Forester', 124, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (842, 'Crosstrek', 124, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (843, 'Impreza', 124, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (844, 'Legacy', 124, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (845, 'Ascent', 124, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (846, 'WRX', 124, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (847, 'BRZ', 124, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (848, 'Swift', 125, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (849, 'Vitara', 125, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (850, 'Jimny', 125, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (851, 'S-Cross', 125, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (852, 'Ignis', 125, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (853, 'Model 1', 126, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (854, 'Model 2', 126, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (855, 'Model 3', 126, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (856, 'Premium', 126, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (857, 'Sport', 126, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (858, 'Luxury', 126, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (859, 'Standard', 126, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (860, 'Model S', 127, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (861, 'Model 3', 127, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (862, 'Model X', 127, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (863, 'Model Y', 127, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (864, 'Cybertruck', 127, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (865, 'Model 1', 129, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (866, 'Model 2', 129, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (867, 'Model 3', 129, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (868, 'Premium', 129, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (869, 'Sport', 129, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (870, 'Luxury', 129, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (871, 'Standard', 129, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (872, 'Model 1', 130, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (873, 'Model 2', 130, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (874, 'Model 3', 130, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (875, 'Premium', 130, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (876, 'Sport', 130, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (877, 'Luxury', 130, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (878, 'Standard', 130, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (879, 'Model 1', 131, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (880, 'Model 2', 131, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (881, 'Model 3', 131, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (882, 'Premium', 131, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (883, 'Sport', 131, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (884, 'Luxury', 131, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (885, 'Standard', 131, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (886, 'Golf', 132, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (887, 'Passat', 132, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (888, 'Tiguan', 132, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (889, 'Atlas', 132, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (890, 'Jetta', 132, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (891, 'Arteon', 132, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (892, 'ID.4', 132, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (893, 'Taos', 132, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (894, 'GTI', 132, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (895, 'XC90', 133, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (896, 'XC60', 133, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (897, 'XC40', 133, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (898, 'S60', 133, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (899, 'S90', 133, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (900, 'V60', 133, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (901, 'V90', 133, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (902, 'Model 1', 134, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (903, 'Model 2', 134, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (904, 'Model 3', 134, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (905, 'Premium', 134, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (906, 'Sport', 134, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (907, 'Luxury', 134, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (908, 'Standard', 134, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (909, 'Model 1', 135, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (910, 'Model 2', 135, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (911, 'Model 3', 135, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (912, 'Premium', 135, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (913, 'Sport', 135, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (914, 'Luxury', 135, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (915, 'Standard', 135, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (916, 'Model 1', 136, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (917, 'Model 2', 136, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (918, 'Model 3', 136, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (919, 'Premium', 136, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (920, 'Sport', 136, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (921, 'Luxury', 136, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (922, 'Standard', 136, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (923, 'Model 1', 137, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (924, 'Model 2', 137, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (925, 'Model 3', 137, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (926, 'Premium', 137, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (927, 'Sport', 137, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (928, 'Luxury', 137, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (929, 'Standard', 137, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (930, 'Model 1', 138, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (931, 'Model 2', 138, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (932, 'Model 3', 138, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (933, 'Premium', 138, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (934, 'Sport', 138, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (935, 'Luxury', 138, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (936, 'Standard', 138, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (937, 'Model 1', 139, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (938, 'Model 2', 139, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (939, 'Model 3', 139, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (940, 'Premium', 139, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (941, 'Sport', 139, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (942, 'Luxury', 139, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (943, 'Standard', 139, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (944, 'Model 1', 140, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (945, 'Model 2', 140, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (946, 'Model 3', 140, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (947, 'Premium', 140, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (948, 'Sport', 140, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (949, 'Luxury', 140, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (950, 'Standard', 140, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (951, 'Model 1', 141, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (952, 'Model 2', 141, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (953, 'Model 3', 141, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (954, 'Premium', 141, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (955, 'Sport', 141, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (956, 'Luxury', 141, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (957, 'Standard', 141, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (958, 'Model 1', 142, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (959, 'Model 2', 142, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (960, 'Model 3', 142, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (961, 'Premium', 142, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (962, 'Sport', 142, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (963, 'Luxury', 142, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (964, 'Standard', 142, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (965, 'Model 1', 143, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (966, 'Model 2', 143, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (967, 'Model 3', 143, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (968, 'Premium', 143, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (969, 'Sport', 143, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (970, 'Luxury', 143, '2025-04-01 17:14:11.712192');
INSERT INTO public.models (id, name, brand_id, created_at) VALUES (971, 'Standard', 143, '2025-04-01 17:14:11.712192');


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Name: brands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.brands_id_seq', 572);


--
-- Name: car_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.car_images_id_seq', 14);


--
-- Name: car_models_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.car_models_id_seq', 1105);


--
-- Name: cars_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cars_id_seq', 13);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 10);


--
-- Name: door_counts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.door_counts_id_seq', 3);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.locations_id_seq', 15);


--
-- Name: models_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.models_id_seq', 971);


--
-- Name: specifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.specifications_id_seq', 73);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 7);


--
-- Name: wishlists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wishlists_id_seq', 4);


--
-- PostgreSQL database dump complete
--

