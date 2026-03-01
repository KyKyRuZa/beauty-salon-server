-- ============================================
-- Миграция: Связь между master_availability и slots
-- Дата: 1 марта 2026 г.
-- Описание: Добавление foreign key для связи слотов с расписанием мастеров
-- ============================================

-- Добавляем колонку master_availability_id в таблицу slots
ALTER TABLE booking_schema.slots
ADD COLUMN IF NOT EXISTS master_availability_id INTEGER;

-- Добавляем внешний ключ с ссылкой на master_availability
ALTER TABLE booking_schema.slots
ADD CONSTRAINT fk_slots_master_availability
FOREIGN KEY (master_availability_id)
REFERENCES booking_schema.master_availability(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Создаем индекс для ускорения запросов по связи
CREATE INDEX IF NOT EXISTS idx_slots_master_availability_id
ON booking_schema.slots(master_availability_id);

-- Добавляем комментарий
COMMENT ON COLUMN booking_schema.slots.master_availability_id IS 'Ссылка на запись расписания мастера, из которого создан слот';

-- Проверка добавленных изменений
DO $$
DECLARE
    column_exists BOOLEAN;
    constraint_exists BOOLEAN;
    index_exists BOOLEAN;
BEGIN
    -- Проверка колонки
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'booking_schema'
        AND table_name = 'slots'
        AND column_name = 'master_availability_id'
    ) INTO column_exists;

    -- Проверка ограничения
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_slots_master_availability'
    ) INTO constraint_exists;

    -- Проверка индекса
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'booking_schema'
        AND indexname = 'idx_slots_master_availability_id'
    ) INTO index_exists;

    IF column_exists AND constraint_exists AND index_exists THEN
        RAISE NOTICE 'Миграция успешно применена: связь master_availability ↔ slots добавлена';
    ELSE
        RAISE WARNING 'Миграция применена частично. Проверьте логи.';
    END IF;
END $$;
