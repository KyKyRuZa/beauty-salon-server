-- ============================================
-- Миграция: Переименование deletedAt → deleted_at
-- Дата: 1 марта 2026 г.
-- Описание: Исправление стиля именования для единообразия (snake_case)
-- ============================================

-- ============================================
-- catalog_schema
-- ============================================

ALTER TABLE catalog_schema.service_categories
RENAME COLUMN "deletedAt" TO deleted_at;

ALTER TABLE catalog_schema.service_subcategories
RENAME COLUMN "deletedAt" TO deleted_at;

-- ============================================
-- user_schema
-- ============================================

ALTER TABLE user_schema.admins
RENAME COLUMN "deletedAt" TO deleted_at;

ALTER TABLE user_schema.clients
RENAME COLUMN "deletedAt" TO deleted_at;

ALTER TABLE user_schema.favorites
RENAME COLUMN "deletedAt" TO deleted_at;

ALTER TABLE user_schema.reviews
RENAME COLUMN "deletedAt" TO deleted_at;

ALTER TABLE user_schema.salons
RENAME COLUMN "deletedAt" TO deleted_at;

ALTER TABLE user_schema.users
RENAME COLUMN "deletedAt" TO deleted_at;

-- ============================================
-- Проверка
-- ============================================

DO $$
DECLARE
    rec RECORD;
    wrong_count INTEGER := 0;
    correct_count INTEGER := 0;
BEGIN
    -- Ищем колонки deletedAt (неправильно)
    SELECT COUNT(*) INTO wrong_count
    FROM information_schema.columns
    WHERE column_name = 'deletedAt'
    AND table_schema IN ('user_schema', 'catalog_schema', 'booking_schema');

    -- Ищем колонки deleted_at (правильно)
    SELECT COUNT(*) INTO correct_count
    FROM information_schema.columns
    WHERE column_name = 'deleted_at'
    AND table_schema IN ('user_schema', 'catalog_schema', 'booking_schema');

    IF wrong_count = 0 THEN
        RAISE NOTICE '✅ Все колонки переименованы в deleted_at';
    ELSE
        RAISE WARNING '❌ Найдено колонок deletedAt: %', wrong_count;
    END IF;

    RAISE NOTICE '✅ Найдено колонок deleted_at: %', correct_count;
END $$;
