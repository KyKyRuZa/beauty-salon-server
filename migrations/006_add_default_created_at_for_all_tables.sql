-- ============================================
-- Миграция: Добавление DEFAULT CURRENT_TIMESTAMP для created_at
-- Дата: 1 марта 2026 г.
-- Описание: Установка значения по умолчанию для всех таблиц с created_at
-- ============================================

-- ============================================
-- booking_schema
-- ============================================

-- slots
ALTER TABLE booking_schema.slots
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- booking
ALTER TABLE booking_schema.booking
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- master_availability
ALTER TABLE booking_schema.master_availability
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- user_schema
-- ============================================

-- users
ALTER TABLE user_schema.users
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- masters
ALTER TABLE user_schema.masters
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- clients
ALTER TABLE user_schema.clients
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- salons
ALTER TABLE user_schema.salons
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- admins
ALTER TABLE user_schema.admins
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- reviews
ALTER TABLE user_schema.reviews
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- favorites
ALTER TABLE user_schema.favorites
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- master_skills
ALTER TABLE user_schema.master_skills
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- master_portfolio
ALTER TABLE user_schema.master_portfolio
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- catalog_schema
-- ============================================

-- service_categories
ALTER TABLE catalog_schema.service_categories
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- service_subcategories
ALTER TABLE catalog_schema.service_subcategories
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- master_services
ALTER TABLE catalog_schema.master_services
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- Проверка
-- ============================================

DO $$
DECLARE
    rec RECORD;
    total_count INTEGER := 0;
    updated_count INTEGER := 0;
BEGIN
    -- Получаем все таблицы с колонкой created_at
    FOR rec IN
        SELECT DISTINCT table_schema, table_name, column_name
        FROM information_schema.columns
        WHERE column_name = 'created_at'
        AND table_schema IN ('user_schema', 'catalog_schema', 'booking_schema')
    LOOP
        total_count := total_count + 1;
        
        -- Проверяем, есть ли DEFAULT
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = rec.table_schema
            AND table_name = rec.table_name
            AND column_name = rec.column_name
            AND column_default IS NOT NULL
        ) THEN
            updated_count := updated_count + 1;
            RAISE NOTICE '✅ %.% - DEFAULT установлен', rec.table_name, rec.column_name;
        ELSE
            RAISE WARNING '❌ %.% - DEFAULT НЕ установлен', rec.table_name, rec.column_name;
        END IF;
    END LOOP;

    RAISE NOTICE '---';
    RAISE NOTICE 'Всего таблиц с created_at: %', total_count;
    RAISE NOTICE 'С DEFAULT значением: %', updated_count;
END $$;
