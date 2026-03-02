-- ============================================
-- Тестовые данные для E2E тестирования бронирования
-- Дата: 1 марта 2026 г.
-- ============================================

-- ============================================
-- 1. Создаём тестового клиента (если нет)
-- ============================================
INSERT INTO user_schema.users (phone, email, password, role, is_active, created_at, updated_at)
VALUES (
  '+79990000001',
  'e2e-client@test.ru',
  '$2b$10$rHkzB6vGzKxQ7J8XqZ9LpOYmN5V3W2U1T0S9R8Q7P6O5N4M3L2K1J', -- TestPass123!
  'client',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_schema.clients (user_id, first_name, last_name, created_at, updated_at)
SELECT u.id, 'E2E', 'Client', NOW(), NOW()
FROM user_schema.users u
WHERE u.email = 'e2e-client@test.ru'
  AND NOT EXISTS (SELECT 1 FROM user_schema.clients c WHERE c.user_id = u.id);

-- ============================================
-- 2. Создаём тестовые слоты для бронирования
-- ============================================

-- Получаем ID мастера (Екатерина Волкова, id=1)
-- Создаём слоты на ближайшие 7 дней

DO $$
DECLARE
    master_id INTEGER := 1;
    service_id INTEGER := 1;
    start_date DATE := CURRENT_DATE + INTERVAL '1 day';
    slot_start TIMESTAMP;
    slot_end TIMESTAMP;
    i INTEGER;
    d INTEGER;
BEGIN
    -- Создаём слоты на 7 дней вперёд
    FOR d IN 0..6 LOOP
        -- Создаём слоты с 10:00 до 18:00 каждый час
        FOR i IN 0..7 LOOP
            slot_start := (start_date + d) + (i + 10) * INTERVAL '1 hour';
            slot_end := slot_start + INTERVAL '1 hour';
            
            INSERT INTO booking_schema.slots (master_id, service_id, start_time, end_time, status, source, created_at)
            VALUES (
                master_id,
                service_id,
                slot_start,
                slot_end,
                'free',
                'auto',
                NOW()
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Созданы тестовые слоты на 7 дней';
END $$;

-- ============================================
-- 3. Создаём тестовое бронирование для отмены
-- ============================================

-- Получаем ID клиента
DO $$
DECLARE
    client_id INTEGER;
    master_id INTEGER := 1;
    service_id INTEGER := 1;
    slot_id INTEGER;
    booking_start TIMESTAMP;
    booking_end TIMESTAMP;
BEGIN
    -- Получаем ID клиента
    SELECT c.id INTO client_id
    FROM user_schema.clients c
    JOIN user_schema.users u ON c.user_id = u.id
    WHERE u.email = 'e2e-client@test.ru';
    
    -- Получаем первый свободный слот
    SELECT s.id, s.start_time, s.end_time INTO slot_id, booking_start, booking_end
    FROM booking_schema.slots s
    WHERE s.master_id = 1
      AND s.status = 'free'
      AND s.start_time > NOW()
    ORDER BY s.start_time
    LIMIT 1;
    
    -- Создаём тестовое бронирование
    IF client_id IS NOT NULL AND slot_id IS NOT NULL THEN
        INSERT INTO booking_schema.booking (
            client_id, master_id, master_service_id, 
            time_slot_id, start_time, end_time, 
            status, created_at, updated_at
        ) VALUES (
            client_id, master_id, service_id,
            slot_id, booking_start, booking_end,
            'confirmed', NOW(), NOW()
        )
        ON CONFLICT DO NOTHING;
        
        -- Обновляем статус слота
        UPDATE booking_schema.slots
        SET status = 'booked'
        WHERE id = slot_id;
        
        RAISE NOTICE 'Создано тестовое бронирование для отмены';
    END IF;
END $$;

-- ============================================
-- 4. Создаём тестовые избранные записи
-- ============================================

DO $$
DECLARE
    v_user_id INTEGER;
    v_master_id INTEGER := 1;
BEGIN
    -- Получаем ID пользователя клиента
    SELECT u.id INTO v_user_id
    FROM user_schema.users u
    WHERE u.email = 'e2e-client@test.ru';
    
    -- Добавляем в избранное мастера
    IF v_user_id IS NOT NULL THEN
        INSERT INTO user_schema.favorites (user_id, master_id, created_at, updated_at)
        VALUES (v_user_id, v_master_id, NOW(), NOW())
        ON CONFLICT (user_id, master_id) DO NOTHING;
        
        RAISE NOTICE 'Добавлено в избранное';
    END IF;
END $$;

-- ============================================
-- Проверка созданных данных
-- ============================================
DO $$
DECLARE
    slots_count INTEGER;
    bookings_count INTEGER;
    favorites_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO slots_count FROM booking_schema.slots WHERE master_id = 1 AND start_time > NOW();
    SELECT COUNT(*) INTO bookings_count FROM booking_schema.booking WHERE master_id = 1;
    SELECT COUNT(*) INTO favorites_count FROM user_schema.favorites WHERE master_id = 1;
    
    RAISE NOTICE '---';
    RAISE NOTICE 'Тестовые данные созданы:';
    RAISE NOTICE '  - Слоты: %', slots_count;
    RAISE NOTICE '  - Бронирования: %', bookings_count;
    RAISE NOTICE '  - Избранное: %', favorites_count;
END $$;
