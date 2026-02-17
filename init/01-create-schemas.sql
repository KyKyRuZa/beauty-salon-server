-- Инициализация схем для PostgreSQL 17.7
-- Этот скрипт создает необходимые схемы в базе данных

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