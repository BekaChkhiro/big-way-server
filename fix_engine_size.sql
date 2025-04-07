ALTER TABLE specifications DROP CONSTRAINT valid_engine_size; ALTER TABLE specifications ADD CONSTRAINT valid_engine_size CHECK (engine_size IS NULL OR (engine_size >= 0.05 AND engine_size <= 13.0));
