-- ============================================
-- Миграция: Тестовые данные для E2E тестирования
-- Дата: 1 марта 2026 г.
-- Описание: Создание услуг для мастеров и слотов
-- ============================================

-- ============================================
-- 1. Создаём услуги для мастеров (2 услуги на категорию)
-- ============================================

-- Категория 1: Парикмахерские услуги (мастера 1, 44, 48)
INSERT INTO catalog_schema.master_services (master_id, salon_id, category_id, name, description, price, is_active, created_at)
VALUES 
  (1, NULL, 1, 'Стрижка женская', 'Стрижка любой длины с укладкой', 2500, true, NOW()),
  (1, NULL, 1, 'Окрашивание волос', 'Окрашивание в один тон (любая длина)', 5000, true, NOW()),
  (44, NULL, 1, 'Стрижка мужская', 'Мужская стрижка с мытьём головы', 1800, true, NOW()),
  (44, NULL, 1, 'Стрижка бороды', 'Моделирование и стрижка бороды', 1200, true, NOW())
ON CONFLICT DO NOTHING;

-- Категория 2: Ногтевой сервис (мастер 2)
INSERT INTO catalog_schema.master_services (master_id, salon_id, category_id, name, description, price, is_active, created_at)
VALUES 
  (2, NULL, 2, 'Маникюр комбинированный', 'Маникюр с покрытием гель-лак', 2200, true, NOW()),
  (2, NULL, 2, 'Педикюр полный', 'Педикюр с покрытием гель-лак', 2800, true, NOW())
ON CONFLICT DO NOTHING;

-- Категория 3: Брови и ресницы (мастер 2)
INSERT INTO catalog_schema.master_services (master_id, salon_id, category_id, name, description, price, is_active, created_at)
VALUES 
  (2, NULL, 3, 'Коррекция бровей', 'Коррекция бровей воском/пинцетом', 800, true, NOW()),
  (2, NULL, 3, 'Окрашивание бровей', 'Окрашивание бровей краской', 1000, true, NOW())
ON CONFLICT DO NOTHING;

-- Категория 4: Визаж (мастер 1)
INSERT INTO catalog_schema.master_services (master_id, salon_id, category_id, name, description, price, is_active, created_at)
VALUES 
  (1, NULL, 4, 'Дневной макияж', 'Лёгкий дневной макияж', 3000, true, NOW()),
  (1, NULL, 4, 'Вечерний макияж', 'Вечерний/свадебный макияж', 5000, true, NOW())
ON CONFLICT DO NOTHING;

-- Категория 5: Косметология (мастер 3)
INSERT INTO catalog_schema.master_services (master_id, salon_id, category_id, name, description, price, is_active, created_at)
VALUES 
  (3, NULL, 5, 'Чистка лица', 'Ультразвуковая чистка лица', 3500, true, NOW()),
  (3, NULL, 5, 'Пилинг лица', 'Химический пилинг лица', 4000, true, NOW())
ON CONFLICT DO NOTHING;

-- Категория 6: Массаж (мастер 3)
INSERT INTO catalog_schema.master_services (master_id, salon_id, category_id, name, description, price, is_active, created_at)
VALUES 
  (3, NULL, 6, 'Массаж спины', 'Лечебный массаж спины (30 мин)', 2000, true, NOW()),
  (3, NULL, 6, 'Общий массаж', 'Общий массаж тела (60 мин)', 3500, true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. Создаём доступность для мастеров (2 дня)
-- ============================================

DO $$
DECLARE
    master_record RECORD;
    start_date DATE := CURRENT_DATE + INTERVAL '1 day';
    service_id_var INTEGER;
BEGIN
    -- Мастер 1 (Екатерина) - категории 1, 4
    FOR service_id_var IN 
        SELECT id FROM catalog_schema.master_services WHERE master_id = 1 LIMIT 2
    LOOP
        -- День 1
        INSERT INTO booking_schema.master_availability (master_id, service_id, date, start_time, end_time, slot_duration, is_available, created_at, updated_at)
        VALUES (1, service_id_var, start_date, '09:00:00', '18:00:00', 60, true, NOW(), NOW())
        ON CONFLICT DO NOTHING;
        
        -- День 2
        INSERT INTO booking_schema.master_availability (master_id, service_id, date, start_time, end_time, slot_duration, is_available, created_at, updated_at)
        VALUES (1, service_id_var, start_date + 1, '09:00:00', '18:00:00', 60, true, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Мастер 2 (Ольга) - категории 2, 3
    FOR service_id_var IN 
        SELECT id FROM catalog_schema.master_services WHERE master_id = 2 LIMIT 2
    LOOP
        -- День 1
        INSERT INTO booking_schema.master_availability (master_id, service_id, date, start_time, end_time, slot_duration, is_available, created_at, updated_at)
        VALUES (2, service_id_var, start_date, '10:00:00', '19:00:00', 90, true, NOW(), NOW())
        ON CONFLICT DO NOTHING;
        
        -- День 2
        INSERT INTO booking_schema.master_availability (master_id, service_id, date, start_time, end_time, slot_duration, is_available, created_at, updated_at)
        VALUES (2, service_id_var, start_date + 1, '10:00:00', '19:00:00', 90, true, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Мастер 3 (Дмитрий) - категории 5, 6
    FOR service_id_var IN 
        SELECT id FROM catalog_schema.master_services WHERE master_id = 3 LIMIT 2
    LOOP
        -- День 1
        INSERT INTO booking_schema.master_availability (master_id, service_id, date, start_time, end_time, slot_duration, is_available, created_at, updated_at)
        VALUES (3, service_id_var, start_date, '11:00:00', '20:00:00', 60, true, NOW(), NOW())
        ON CONFLICT DO NOTHING;
        
        -- День 2
        INSERT INTO booking_schema.master_availability (master_id, service_id, date, start_time, end_time, slot_duration, is_available, created_at, updated_at)
        VALUES (3, service_id_var, start_date + 1, '11:00:00', '20:00:00', 60, true, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Доступность мастеров создана';
END $$;

-- ============================================
-- 3. Генерируем слоты для каждого дня доступности
-- ============================================

DO $$
DECLARE
    avail_record RECORD;
    slot_start TIMESTAMP;
    slot_end TIMESTAMP;
    duration_minutes INTEGER;
    availability_id_var INTEGER;
BEGIN
    -- Проходим по всем записям доступности
    FOR avail_record IN 
        SELECT id, master_id, service_id, date, start_time, end_time, slot_duration
        FROM booking_schema.master_availability
        WHERE is_available = true
    LOOP
        availability_id_var := avail_record.id;
        duration_minutes := avail_record.slot_duration;
        
        -- Генерируем слоты
        slot_start := avail_record.date + avail_record.start_time;
        slot_end := slot_start + (duration_minutes * INTERVAL '1 minute');
        
        WHILE slot_end <= (avail_record.date + avail_record.end_time) LOOP
            INSERT INTO booking_schema.slots (master_id, service_id, master_availability_id, start_time, end_time, status, source, created_at)
            VALUES (
                avail_record.master_id,
                avail_record.service_id,
                availability_id_var,
                slot_start,
                slot_end,
                'free',
                'auto',
                NOW()
            )
            ON CONFLICT DO NOTHING;
            
            slot_start := slot_end;
            slot_end := slot_start + (duration_minutes * INTERVAL '1 minute');
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Слоты сгенерированы';
END $$;

-- ============================================
-- 4. Проверка созданных данных
-- ============================================
DO $$
DECLARE
    services_count INTEGER;
    availability_count INTEGER;
    slots_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO services_count FROM catalog_schema.master_services;
    SELECT COUNT(*) INTO availability_count FROM booking_schema.master_availability WHERE is_available = true;
    SELECT COUNT(*) INTO slots_count FROM booking_schema.slots WHERE status = 'free';
    
    RAISE NOTICE '---';
    RAISE NOTICE 'Тестовые данные созданы:';
    RAISE NOTICE '  - Услуги мастеров: %', services_count;
    RAISE NOTICE '  - Дни доступности: %', availability_count;
    RAISE NOTICE '  - Свободные слоты: %', slots_count;
END $$;
