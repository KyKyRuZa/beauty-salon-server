CREATE EXTENSION IF NOT EXISTS postgis;

-- pg_trgm - для нечеткого поиска
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- btree_gin - для GIN индексов
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- pg_stat_statements - для мониторинга
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- pg_prewarm - для кэширования
CREATE EXTENSION IF NOT EXISTS pg_prewarm;

-- Создание схем для организации базы данных
CREATE SCHEMA IF NOT EXISTS user_schema;
CREATE SCHEMA IF NOT EXISTS catalog_schema;
CREATE SCHEMA IF NOT EXISTS booking_schema;

-- Предоставление необходимых прав доступа к схемам
GRANT USAGE ON SCHEMA user_schema TO postgres;
GRANT CREATE ON SCHEMA user_schema TO postgres;
GRANT USAGE ON SCHEMA catalog_schema TO postgres;
GRANT CREATE ON SCHEMA catalog_schema TO postgres;
GRANT USAGE ON SCHEMA booking_schema TO postgres;
GRANT CREATE ON SCHEMA booking_schema TO postgres;

-- Предоставление прав на таблицы в схемах (для уже созданных таблиц)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA user_schema TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA catalog_schema TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA booking_schema TO postgres;

-- Предоставление прав на последовательности в схемах
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA user_schema TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA catalog_schema TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA booking_schema TO postgres;

-- Уведомление об успешной инициализации
DO $$ 
BEGIN
    RAISE NOTICE 'Схемы для beauty_vite_db успешно созданы и настроены';
END $$;