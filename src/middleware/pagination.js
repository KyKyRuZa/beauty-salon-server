/**
 * Pagination Middleware
 * Стандартизированная пагинация для всех list endpoints
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Парсит параметры пагинации из query
 * @param {Object} query - req.query
 * @returns {Object} { page, limit, offset }
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Middleware для добавления пагинации в req
 */
const pagination = (req, res, next) => {
  const { page, limit, offset } = parsePagination(req.query);

  req.pagination = {
    page,
    limit,
    offset,
  };

  next();
};

/**
 * Форматирует ответ с пагинацией
 * @param {Object} res - Express response
 * @param {Array} data - Данные
 * @param {number} total - Общее количество записей
 * @param {Object} req - Express request
 * @returns {Object}
 */
const paginatedResponse = (res, data, total, req) => {
  const { page, limit } = req.pagination;
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
      requestId: req.requestId,
    },
  });
};

module.exports = {
  pagination,
  paginatedResponse,
  parsePagination,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
