const { v4: uuidv4 } = require('uuid');

/**
 * Request ID Middleware
 * Добавляет уникальный идентификатор каждому запросу для трейсинга
 */

const requestLogger = (req, res, next) => {
  // Получаем Request ID из заголовков или генерируем новый
  const requestId = req.headers['x-request-id'] || uuidv4();
  
  // Добавляем в объект запроса
  req.requestId = requestId;
  
  // Добавляем в ответ
  res.setHeader('X-Request-ID', requestId);
  
  // Добавляем в логгер (если используется)
  if (req.log) {
    req.log.child({ requestId });
  }
  
  // Логируем начало запроса
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

/**
 * Helper для получения Request ID из любого места
 */
const getRequestId = (req) => {
  return req.requestId || req.headers['x-request-id'] || 'unknown';
};

module.exports = {
  requestLogger,
  getRequestId,
};
