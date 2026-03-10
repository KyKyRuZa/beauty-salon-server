-- Добавление мастеров для салонов без мастеров
-- Запуск: docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d beauty_vite_db -f /docker-entrypoint-initdb.d/add_more_masters.sql

-- Временная таблица для распределения мастеров по салонам
WITH salons_without_masters AS (
  SELECT s.id, s.name
  FROM user_schema.salons s
  LEFT JOIN user_schema.masters m ON m.salon_id = s.id
  WHERE m.id IS NULL
),
new_masters AS (
  INSERT INTO user_schema.masters (user_id, salon_id, first_name, last_name, specialization, experience, bio, image_url, is_available, address, has_training, rating, created_at, updated_at)
  SELECT
    u.id as user_id,
    swm.id as salon_id,
    (ARRAY['Анна', 'Елена', 'Наталья', 'Ольга', 'Татьяна', 'Юлия', 'Светлана', 'Ирина', 'Марина', 'Екатерина'])[ROW_NUMBER() OVER (ORDER BY swm.id) % 10 + 1] as first_name,
    (ARRAY['Иванова', 'Петрова', 'Сидорова', 'Кузнецова', 'Попова', 'Соколова', 'Лебедева', 'Козлова', 'Новикова', 'Морозова'])[ROW_NUMBER() OVER (ORDER BY swm.id) % 10 + 1] as last_name,
    (ARRAY['Парикмахер-стилист', 'Мастер маникюра', 'Косметолог', 'Визажист', 'Мастер педикюра'])[ROW_NUMBER() OVER (ORDER BY swm.id) % 5 + 1] as specialization,
    (RANDOM() * 10 + 1)::integer as experience,
    'Опытный мастер с индивидуальным подходом к каждому клиенту.' as bio,
    'https://cdn.pixabay.com/photo/2017/08/30/01/05/milf-2695672_960_720.jpg' as image_url,
    true as is_available,
    s.address as address,
    (RANDOM() > 0.5) as has_training,
    (4 + RANDOM())::numeric(3,2) as rating,
    NOW() as created_at,
    NOW() as updated_at
  FROM salons_without_masters swm
  JOIN user_schema.users u ON u.role = 'master' AND u.id > 7
  JOIN user_schema.salons s ON s.id = swm.id
  LIMIT 9
)
SELECT COUNT(*) as masters_added FROM new_masters;

-- Проверка результата
SELECT 
  s.name as salon,
  COUNT(m.id) as masters_count
FROM user_schema.salons s
LEFT JOIN user_schema.masters m ON m.salon_id = s.id
GROUP BY s.name
ORDER BY masters_count DESC, s.name;
