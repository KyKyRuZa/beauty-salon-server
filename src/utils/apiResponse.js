/**
 * Стандартные форматы ответов API
 */

/**
 * Успешный ответ
 */
const successResponse = (res, data, meta = {}) => {
  return res.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
};

/**
 * Ответ с ошибкой
 */
const errorResponse = (res, statusCode, code, message, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Пагинация
 */
const paginatedResponse = (res, data, total, page = 1, limit = 20, meta = {}) => {
  const totalPages = Math.ceil(total / limit);

  return res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
