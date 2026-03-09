# 📜 Скрипты для работы с базой данных

## 🚀 Быстрый старт

### Очистить БД + сбросить ID + заполнить данными:
```bash
docker compose -f docker-compose.dev.yml exec backend npm run reset-and-seed
```

Или по отдельности:
```bash
# Очистить БД и сбросить ID к 1
docker compose -f docker-compose.dev.yml exec backend npm run reset-db

# Заполнить тестовыми данными
docker compose -f docker-compose.dev.yml exec backend npm run seed
```

---

## 📁 Описание скриптов

### `reset-db.js` - Очистка БД и сброс ID
**Что делает:**
- ✅ Удаляет ВСЕ данные из таблиц
- ✅ Сбрасывает все последовательности (ID) к 1
- ✅ Не трогает структуру БД

**Когда использовать:**
- Перед каждым запуском seed чтобы избежать дублирования
- Когда нужно начать с чистого листа

**Команда:**
```bash
docker compose -f docker-compose.dev.yml exec backend node scripts/reset-db.js
```

---

### `seed_test_data.js` - Заполнение тестовыми данными
**Что делает:**
- ✅ Создаёт тестовых пользователей (25)
- ✅ Создаёт салоны (15) с локациями
- ✅ Создаёт мастеров (6) с услугами
- ✅ Генерирует расписание и временные слоты
- ✅ Создаёт тестовые бронирования

**Когда использовать:**
- После очистки БД
- Для заполнения тестовыми данными

**Команда:**
```bash
docker compose -f docker-compose.dev.yml exec backend node scripts/seed_test_data.js
```

---

### `reset_sequences.sql` - SQL скрипт сброса ID
Используется внутри `reset-db.js`. Содержит SQL команды для сброса всех последовательностей.

---

## 📊 Какие данные создаются

### Пользователи (25):
- 1 администратор
- 3 клиента
- 6 мастеров
- 15 салонов

### Салоны (15) по городам:
- **Казань**: 4 салона
- **Альметьевск**: 2 салона
- **Набережные Челны**: 3 салона
- **Уфа**: 3 салона
- **Ижевск**: 3 салона

### Мастера (6):
- 3 парикмахера
- 1 маникюр/педикюр
- 1 визажист
- 1 косметолог

### Услуги (11):
- Парикмахерские (4)
- Ногтевой сервис (4)
- Барберские (3)

### Расписание:
- 25 записей доступности
- 105 временных слотов
- 5 тестовых бронирований

---

## 🔑 Учётные данные

### Администратор:
- **Email:** `admin@beauty-vite.ru`
- **Пароль:** `AdminPass123!`

### Клиенты:
- `ivan.petrov@example.com` / `ClientPass123!`
- `maria.sidorova@example.com` / `ClientPass456!`
- `anna.kuznetsova@example.com` / `ClientPass789!`

### Мастера:
- `ekaterina.volkova@example.com` / `MasterPass123!`
- `olga.novikova@example.com` / `MasterPass456!`
- `dmitry.sokolov@example.com` / `MasterPass789!`
- `natalia.ivanova@example.com` / `MasterPass123!`
- `maria.kuznetsova@example.com` / `MasterPass456!`
- `elena.popova@example.com` / `MasterPass789!`

### Салоны (первые 5):
- `beauty.salon@example.com` / `SalonPass123!`
- `style.house@example.com` / `SalonPass456!`
- `lazurit@example.com` / `SalonPass789!`
- `myata@example.com` / `SalonPass012!`
- `sharm@example.com` / `SalonPass123!`

---

## ⚠️ Важно!

1. **Всегда запускайте `reset-db` перед `seed`** чтобы избежать дублирования данных
2. **ID сбрасываются к 1** после каждого `reset-db`
3. **Все данные удаляются** при запуске `reset-db` - используйте с осторожностью на production!

---

## 🛠️ Локальный запуск (не в Docker)

Если запускаете сервер локально:
```bash
cd server

# Очистить БД
npm run reset-db

# Заполнить данными
npm run seed

# Всё сразу
npm run reset-and-seed
```

Убедитесь что `.env` настроен правильно и БД доступна!
