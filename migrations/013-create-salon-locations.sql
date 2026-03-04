-- Таблица salon_locations для хранения местоположения салонов
-- Использует PostGIS для работы с геоданными

-- Создаём таблицу
CREATE TABLE IF NOT EXISTS user_schema.salon_locations (
    id SERIAL PRIMARY KEY,
    salon_id INTEGER UNIQUE NOT NULL REFERENCES user_schema.salons(id) ON DELETE CASCADE,
    city VARCHAR(100) NOT NULL,
    address VARCHAR(500) NOT NULL,
    coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    working_hours JSONB DEFAULT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для ускорения поиска
-- Индекс для поиска по городу
CREATE INDEX IF NOT EXISTS salon_locations_city_idx ON user_schema.salon_locations(city);

-- Индекс для поиска по координатам (GiST индекс для PostGIS)
CREATE INDEX IF NOT EXISTS salon_locations_coordinates_idx ON user_schema.salon_locations USING GIST(coordinates);

-- Индекс для поиска по салону
CREATE INDEX IF NOT EXISTS salon_locations_salon_id_idx ON user_schema.salon_locations(salon_id);

-- Индекс для фильтрации по статусу верификации
CREATE INDEX IF NOT EXISTS salon_locations_is_verified_idx ON user_schema.salon_locations(is_verified);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION user_schema.update_salon_location_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автообновления updated_at
DROP TRIGGER IF EXISTS update_salon_location_updated_at ON user_schema.salon_locations;
CREATE TRIGGER update_salon_location_updated_at
    BEFORE UPDATE ON user_schema.salon_locations
    FOR EACH ROW
    EXECUTE FUNCTION user_schema.update_salon_location_updated_at();

-- Предоставление прав
GRANT ALL PRIVILEGES ON user_schema.salon_locations TO postgres;
GRANT USAGE, SELECT ON SEQUENCE user_schema.salon_locations_id_seq TO postgres;

DO $$
BEGIN
    RAISE NOTICE '✅ Таблица salon_locations успешно создана';
END $$;
