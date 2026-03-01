-- ============================================
-- Миграция: Триггеры для защиты от пересечений слотов и бронирований
-- Дата: 1 марта 2026 г.
-- Описание: Создание триггеров для предотвращения перекрывающихся слотов и бронирований
-- ============================================

-- ============================================
-- 1. Триггер для проверки пересечений слотов
-- ============================================

-- Создаем функцию для проверки пересечений временных диапазонов слотов
CREATE OR REPLACE FUNCTION booking_schema.check_slot_overlap()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    -- Проверяем наличие перекрывающихся слотов для того же мастера
    SELECT COUNT(*) INTO overlap_count
    FROM booking_schema.slots
    WHERE master_id = NEW.master_id
      AND id != NEW.id  -- Исключаем текущую запись при обновлении
      AND status != 'blocked'
      AND NEW.status != 'blocked'
      AND (
          -- Проверка пересечения диапазонов
          (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
      );

    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'Обнаружено пересечение временных слотов у мастера % в диапазоне [% - %]', 
            NEW.master_id, NEW.start_time, NEW.end_time
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для проверки при вставке/обновлении
DROP TRIGGER IF EXISTS trg_check_slot_overlap ON booking_schema.slots;
CREATE CONSTRAINT TRIGGER trg_check_slot_overlap
    AFTER INSERT OR UPDATE ON booking_schema.slots
    DEFERRABLE INITIALLY IMMEDIATE
    FOR EACH ROW
    EXECUTE FUNCTION booking_schema.check_slot_overlap();

-- ============================================
-- 2. Триггер для проверки пересечений бронирований
-- ============================================

-- Создаем функцию для проверки пересечений бронирований
CREATE OR REPLACE FUNCTION booking_schema.check_booking_overlap()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    -- Проверяем наличие перекрывающихся бронирований для того же мастера
    SELECT COUNT(*) INTO overlap_count
    FROM booking_schema.booking
    WHERE master_id = NEW.master_id
      AND id != NEW.id  -- Исключаем текущую запись при обновлении
      AND status IN ('confirmed', 'completed')
      AND NEW.status IN ('confirmed', 'completed')
      AND (
          -- Проверка пересечения диапазонов
          (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
      );

    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'Обнаружено пересечение бронирований у мастера % в диапазоне [% - %]', 
            NEW.master_id, NEW.start_time, NEW.end_time
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для проверки при вставке/обновлении
DROP TRIGGER IF EXISTS trg_check_booking_overlap ON booking_schema.booking;
CREATE CONSTRAINT TRIGGER trg_check_booking_overlap
    AFTER INSERT OR UPDATE ON booking_schema.booking
    DEFERRABLE INITIALLY IMMEDIATE
    FOR EACH ROW
    EXECUTE FUNCTION booking_schema.check_booking_overlap();

-- ============================================
-- 3. Дополнительные индексы для производительности
-- ============================================

-- Индекс для быстрого поиска активных броней по статусу и дате
CREATE INDEX IF NOT EXISTS idx_booking_status_created_at
ON booking_schema.booking(status, created_at DESC);

-- Индекс для поиска свободных слотов по статусу и времени начала
CREATE INDEX IF NOT EXISTS idx_slots_status_start_time
ON booking_schema.slots(status, start_time ASC);

-- Индекс для поиска доступных дней мастера
CREATE INDEX IF NOT EXISTS idx_availability_date_available
ON booking_schema.master_availability(date, is_available)
WHERE is_available = true;

-- ============================================
-- Комментарии
-- ============================================

COMMENT ON FUNCTION booking_schema.check_slot_overlap() IS 
'Проверяет отсутствие перекрывающихся слотов у одного мастера';

COMMENT ON FUNCTION booking_schema.check_booking_overlap() IS 
'Проверяет отсутствие перекрывающихся бронирований у одного мастера';

COMMENT ON TRIGGER trg_check_slot_overlap ON booking_schema.slots IS 
'Запрещает создание перекрывающихся слотов (кроме заблокированных)';

COMMENT ON TRIGGER trg_check_booking_overlap ON booking_schema.booking IS 
'Запрещает создание перекрывающихся подтверждённых бронирований';

COMMENT ON INDEX booking_schema.idx_booking_status_created_at IS 
'Составной индекс для выборки активных броней по статусу и дате создания';

COMMENT ON INDEX booking_schema.idx_slots_status_start_time IS 
'Составной индекс для поиска свободных слотов по статусу и времени начала';

COMMENT ON INDEX booking_schema.idx_availability_date_available IS 
'Частичный индекс для быстрого поиска доступных дней мастера';

-- ============================================
-- Проверка добавленных триггеров и функций
-- ============================================

DO $$
DECLARE
    slot_func_exists BOOLEAN;
    booking_func_exists BOOLEAN;
    slot_trigger_exists BOOLEAN;
    booking_trigger_exists BOOLEAN;
BEGIN
    -- Проверка функции для slots
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'booking_schema'
        AND p.proname = 'check_slot_overlap'
    ) INTO slot_func_exists;

    -- Проверка функции для booking
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'booking_schema'
        AND p.proname = 'check_booking_overlap'
    ) INTO booking_func_exists;

    -- Проверка триггера для slots
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_check_slot_overlap'
    ) INTO slot_trigger_exists;

    -- Проверка триггера для booking
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_check_booking_overlap'
    ) INTO booking_trigger_exists;

    IF slot_func_exists AND booking_func_exists THEN
        RAISE NOTICE 'Функции проверки пересечений успешно созданы';
    ELSE
        RAISE WARNING 'Функции созданы частично. Проверьте логи.';
    END IF;

    IF slot_trigger_exists AND booking_trigger_exists THEN
        RAISE NOTICE 'Триггеры защиты от пересечений успешно установлены';
    ELSE
        RAISE WARNING 'Триггеры установлены частично. Проверьте логи.';
    END IF;
END $$;
