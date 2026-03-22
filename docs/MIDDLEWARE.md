# Production Middleware

## Request ID (`requestLogger.js`)

Добавляет уникальный идентификатор каждому запросу для трейсинга.

### Использование

```javascript
const { requestLogger } = require('./middleware/requestLogger');

app.use(requestLogger);
```

### Заголовки

- **Request:** `X-Request-ID` (опционально, если нет — генерируется новый)
- **Response:** `X-Request-ID` (всегда добавляется)

### Логирование

```
[550e8400-e29b-41d4-a716-446655440000] POST /api/v1/booking - 201 (45ms)
```

---

## Pagination (`pagination.js`)

Стандартизированная пагинация для всех list endpoints.

### Использование

```javascript
const { pagination, paginatedResponse } = require('./middleware/pagination');

router.get('/items', pagination, (req, res) => {
  const { page, limit, offset } = req.pagination;
  
  const items = await getItems({ limit, offset });
  const total = await countItems();
  
  return paginatedResponse(res, items, total, req);
});
```

### Параметры

| Параметр | Default | Max |
|----------|---------|-----|
| `page`   | 1       | -   |
| `limit`  | 20      | 100 |

### Ответ

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2026-03-22T19:00:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## Circuit Breaker (`circuitBreaker.js`)

Защита от сбоев внешних сервисов (Redis, Yandex API, etc.).

### Использование

```javascript
const { circuitBreakers } = require('./utils/circuitBreaker');

async function callExternalService() {
  return await circuitBreakers.yandexGeo.call(async () => {
    return await redis.get(key);
  });
}
```

### Состояния

1. **CLOSED** — нормальная работа, запросы проходят
2. **OPEN** — слишком много ошибок, запросы блокируются
3. **HALF_OPEN** — пробный запрос после timeout

### Настройки

```javascript
new CircuitBreaker('ServiceName', {
  failureThreshold: 5,      // Количество ошибок до OPEN
  resetTimeout: 30000,      // Время до HALF_OPEN (мс)
});
```

### Мониторинг

```javascript
const state = circuitBreakers.yandexGeo.getState();
// { service: 'YandexGeoAPI', state: 'CLOSED', failures: 0, nextAttempt: null }
```

---

## OpenAPI Documentation

Swagger спецификация доступна в `docs/openapi.yaml`.

### Просмотр через Docker

Swagger UI запущен в отдельном контейнере:

**URL:** http://localhost:8082

**Через Traefik:** http://localhost/docs

### Что включено:

- ✅ **25 endpoints** — все основные API
- ✅ **Auth** — register, login, logout, profile, edit-profile, change-password
- ✅ **Catalog** — categories, services
- ✅ **Booking** — create, get, cancel, confirm
- ✅ **Availability** — set availability, get available dates
- ✅ **Timeslots** — create, get master slots
- ✅ **Geo** — detect city
- ✅ **Providers** — get profile
- ✅ **Reviews** — create review
- ✅ **Favorites** — add, toggle

### Обновление документации

При изменении API обнови `docs/openapi.yaml`:

```yaml
paths:
  /api/v1/new-endpoint:
    get:
      tags: [ModuleName]
      summary: Description
      responses:
        '200':
          description: Success
```

Контейнер автоматически подхватит изменения!
