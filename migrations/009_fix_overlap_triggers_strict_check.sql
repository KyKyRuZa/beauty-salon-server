-- ============================================
-- Миграция: Исправление триггеров проверки пересечений
-- Дата: 1 марта 2026 г.
-- Описание: Исправление логики OVERLAPS → строгое пересечение
-- ============================================

-- ============================================
-- 1. Исправление триггера для слотов
-- ============================================

CREATE OR REPLACE FUNCTION booking_schema.check_slot_overlap()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    -- Проверяем наличие перекрывающихся слотов для того же мастера
    -- Используем строгое пересечение: start1 < end2 AND end1 > start2
    SELECT COUNT(*) INTO overlap_count
    FROM booking_schema.slots
    WHERE master_id = NEW.master_id
      AND id != NEW.id  -- Исключаем текущую запись при обновлении
      AND status != 'blocked'
      AND NEW.status != 'blocked'
      AND (
          -- Строгая проверка пересечения (без учёта соприкасающихся)
          NEW.start_time < end_time
          AND NEW.end_time > start_time
      );

    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'Обнаружено пересечение временных слотов у мастера % в диапазоне [% - %]', 
            NEW.master_id, NEW.start_time, NEW.end_time
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Исправление триггера для бронирований
-- ============================================

CREATE OR REPLACE FUNCTION booking_schema.check_booking_overlap()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    -- Проверяем наличие перекрывающихся бронирований для того же мастера
    -- Используем строгое пересечение: start1 < end2 AND end1 > start2
    SELECT COUNT(*) INTO overlap_count
    FROM booking_schema.booking
    WHERE master_id = NEW.master_id
      AND id != NEW.id  -- Исключаем текущую запись при обновлении
      AND status IN ('confirmed', 'completed')
      AND NEW.status IN ('confirmed', 'completed')
      AND (
          -- Строгая проверка пересечения (без учёта соприкасающихся)
          NEW.start_time < end_time
          AND NEW.end_time > start_time
      );

    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'Обнаружено пересечение бронирований у мастера % в диапазоне [% - %]', 
            NEW.master_id, NEW.start_time, NEW.end_time
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Проверка
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Триггеры обновлены: теперь используется строгое пересечение (без соприкасающихся диапазонов)';
END $$;
