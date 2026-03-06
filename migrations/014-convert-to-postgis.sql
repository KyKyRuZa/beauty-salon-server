-- ============================================================================
-- Миграция 014: Конвертация координат в PostGIS GEOGRAPHY
-- ============================================================================
-- Описание: Конвертирует координаты из VARCHAR (WKT формат) в GEOGRAPHY(POINT, 4326)
-- для использования гео-запросов PostGIS
-- ============================================================================

BEGIN;

-- 1. Добавляем новую колонку с типом GEOGRAPHY
ALTER TABLE user_schema.salon_locations
ADD COLUMN coordinates_geo GEOGRAPHY(POINT, 4326);

-- 2. Конвертируем существующие данные из WKT-строки в GEOGRAPHY
-- Формат: "SRID=4326;POINT(49.1221 55.7887)"
UPDATE user_schema.salon_locations
SET coordinates_geo = ST_GeographyFromText(coordinates)
WHERE coordinates IS NOT NULL 
  AND coordinates LIKE 'SRID=%;POINT(%';

-- 3. Проверяем, сколько записей сконвертировано
DO $$
DECLARE
    converted_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO converted_count FROM user_schema.salon_locations WHERE coordinates_geo IS NOT NULL;
    SELECT COUNT(*) INTO total_count FROM user_schema.salon_locations;
    RAISE NOTICE 'Конвертировано координат: % из %', converted_count, total_count;
END $$;

-- 4. Делаем новую колонку NOT NULL (если все записи сконвертированы)
ALTER TABLE user_schema.salon_locations
ALTER COLUMN coordinates_geo SET NOT NULL;

-- 5. Создаём GiST индекс для быстрых гео-запросов
CREATE INDEX IF NOT EXISTS salon_locations_coordinates_geo_idx
ON user_schema.salon_locations
USING GIST (coordinates_geo);

-- 6. Добавляем комментарий к колонке
COMMENT ON COLUMN user_schema.salon_locations.coordinates_geo IS 'Гео-координаты в формате PostGIS GEOGRAPHY(POINT, 4326)';

-- 7. Опционально: удаляем старую колонку VARCHAR (раскомментировать если нужно)
-- ALTER TABLE user_schema.salon_locations DROP COLUMN coordinates;

COMMIT;

-- ============================================================================
-- Примеры использования PostGIS запросов:
-- ============================================================================
-- Найти салоны в радиусе 5 км от точки:
-- SELECT *, ST_Distance(coordinates_geo, ST_MakePoint(49.12, 55.79)::geography) as distance
-- FROM user_schema.salon_locations
-- WHERE ST_DWithin(coordinates_geo, ST_MakePoint(49.12, 55.79)::geography, 5000);
--
-- Расстояние между двумя салонами в метрах:
-- SELECT ST_Distance(a.coordinates_geo, b.coordinates_geo) as distance_meters
-- FROM user_schema.salon_locations a, user_schema.salon_locations b
-- WHERE a.id = 1 AND b.id = 2;
-- ============================================================================
