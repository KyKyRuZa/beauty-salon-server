# API Documentation

## Base URL

- **Production**: `https://api.beauty-vite.ru/api/v1`
- **Development**: `http://localhost:5000/api/v1`

## API Versioning

API использует версионирование через URL:

- `/api/v1/` - текущая версия (рекомендуется)
- `/api/` - legacy версия (для обратной совместимости)

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-03-22T16:00:00.000Z"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2026-03-22T16:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ошибка валидации данных",
    "details": [
      {
        "field": "email",
        "message": "Некорректный email"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-03-22T16:00:00.000Z"
  }
}
```

## Error Codes

### Authentication (401-403)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Требуется аутентификация |
| `INVALID_CREDENTIALS` | 401 | Неверные учётные данные |
| `TOKEN_EXPIRED` | 401 | Токен истёк |
| `TOKEN_INVALID` | 401 | Неверный токен |
| `FORBIDDEN` | 403 | Доступ запрещён |

### Validation (400)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Ошибка валидации |
| `INVALID_INPUT` | 400 | Неверный ввод |

### Not Found (404)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Ресурс не найден |
| `USER_NOT_FOUND` | 404 | Пользователь не найден |
| `MASTER_NOT_FOUND` | 404 | Мастер не найден |
| `SALON_NOT_FOUND` | 404 | Салон не найден |
| `SERVICE_NOT_FOUND` | 404 | Услуга не найдена |
| `BOOKING_NOT_FOUND` | 404 | Бронирование не найдено |

### Conflict (409)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CONFLICT` | 409 | Конфликт |
| `DUPLICATE_EMAIL` | 409 | Email уже существует |
| `DUPLICATE_PHONE` | 409 | Телефон уже существует |
| `SLOT_ALREADY_BOOKED` | 409 | Слот уже забронирован |

### Server Errors (500)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка |
| `DATABASE_ERROR` | 500 | Ошибка БД |
| `EXTERNAL_SERVICE_ERROR` | 500 | Ошибка внешнего сервиса |

## Rate Limiting

- **Default**: 100 запросов в 15 минут с одного IP
- **Auth endpoints**: 20 запросов в 15 минут
- **Geo endpoints**: 50 запросов в 15 минут

## Authentication

Для аутентифицированных endpoints добавьте заголовок:

```
Authorization: Bearer <your-jwt-token>
```

## Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "OK",
  "timestamp": "2026-03-22T16:00:00.000Z",
  "services": {
    "database": {
      "status": "connected",
      "message": "База данных доступна"
    },
    "redis": {
      "status": "connected",
      "message": "Redis доступен"
    }
  }
}
```
