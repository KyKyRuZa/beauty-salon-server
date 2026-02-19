-- ============================================
-- Миграция: GIN-индексы для триграммного поиска
-- Дата: 19 февраля 2026 г.
-- Описание: Создание GIN-индексов для быстрого нечеткого поиска
-- ============================================

-- Треграммы для категорий услуг
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_name_trgm 
ON catalog_schema.service_categories 
USING gin (name gin_trgm_ops);

-- Триграммы для подкатегорий
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subcategories_name_trgm 
ON catalog_schema.service_subcategories 
USING gin (name gin_trgm_ops);

-- Триграммы для услуг мастеров
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_master_services_name_trgm 
ON catalog_schema.master_services 
USING gin (name gin_trgm_ops);

-- Триграммы для мастеров (имя)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_masters_first_name_trgm 
ON user_schema.masters 
USING gin (first_name gin_trgm_ops);

-- Триграммы для мастеров (фамилия)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_masters_last_name_trgm 
ON user_schema.masters 
USING gin (last_name gin_trgm_ops);

-- Триграммы для мастеров (специализация)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_masters_specialization_trgm 
ON user_schema.masters 
USING gin (specialization gin_trgm_ops);

-- Триграммы для салонов (название)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salons_name_trgm 
ON user_schema.salons 
USING gin (name gin_trgm_ops);

-- Комментарии к индексам
COMMENT ON INDEX catalog_schema.idx_categories_name_trgm IS 'GIN-индекс для триграммного поиска по названиям категорий';
COMMENT ON INDEX catalog_schema.idx_subcategories_name_trgm IS 'GIN-индекс для триграммного поиска по названиям подкатегорий';
COMMENT ON INDEX catalog_schema.idx_master_services_name_trgm IS 'GIN-индекс для триграммного поиска по названиям услуг мастеров';
COMMENT ON INDEX user_schema.idx_masters_first_name_trgm IS 'GIN-индекс для триграммного поиска по именам мастеров';
COMMENT ON INDEX user_schema.idx_masters_last_name_trgm IS 'GIN-индекс для триграммного поиска по фамилиям мастеров';
COMMENT ON INDEX user_schema.idx_masters_specialization_trgm IS 'GIN-индекс для триграммного поиска по специализации мастеров';
COMMENT ON INDEX user_schema.idx_salons_name_trgm IS 'GIN-индекс для триграммного поиска по названиям салонов';

-- Проверка созданных индексов
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE indexname LIKE 'idx_%_trgm';
    
    RAISE NOTICE 'Создано GIN-индексов для триграмм: %', index_count;
END $$;
