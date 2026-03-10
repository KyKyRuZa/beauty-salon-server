const redis = require('../config/redis');
const { createLogger } = require('./logger');

const logger = createLogger('cache-service');

const CACHE_TTL = {
  SESSION: 3600,           // 1 час
  CATALOG: 300,            // 5 минут
  SERVICES: 300,           // 5 минут
  CATEGORIES: 600,         // 10 минут
  MASTERS: 300,            // 5 минут
  MASTER_SERVICES: 300,    // 5 минут
  SEARCH: 180,             // 3 минуты
  TOP_MASTERS: 2700        // 45 минут
};

const get = async (key) => {
  try {
    const value = await redis.get(key);
    if (value) {
      logger.debug(`Кэш найден: ${key}`);
      return JSON.parse(value);
    }
    logger.debug(`Кэш не найден: ${key}`);
    return null;
  } catch (error) {
    logger.error(`Ошибка получения из кэша: ${error.message}`);
    return null;
  }
};

/**
 * Сохранить значение в кэш
 * @param {string} key - Ключ
 * @param {any} value - Значение
 * @param {number} ttl - Время жизни в секундах
 * @returns {Promise<boolean>}
 */
const set = async (key, value, ttl = CACHE_TTL.SERVICES) => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    logger.debug(`Кэш установлен: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    logger.error(`Ошибка установки в кэш: ${error.message}`);
    return false;
  }
};

/**
 * Удалить значение из кэша
 * @param {string} key - Ключ
 * @returns {Promise<boolean>}
 */
const del = async (key) => {
  try {
    await redis.del(key);
    logger.debug(`Кэш удалён: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Ошибка удаления из кэша: ${error.message}`);
    return false;
  }
};

/**
 * Очистить кэш по паттерну
 * @param {string} pattern - Паттерн (например, "catalog:*")
 * @returns {Promise<boolean>}
 */
const clearByPattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug(`Кэш очищен: ${keys.length} ключей по паттерну ${pattern}`);
    }
    return true;
  } catch (error) {
    logger.error(`Ошибка очистки кэша: ${error.message}`);
    return false;
  }
};

/**
 * Проверить существование ключа
 * @param {string} key - Ключ
 * @returns {Promise<boolean>}
 */
const exists = async (key) => {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    logger.error(`Ошибка проверки существования ключа: ${error.message}`);
    return false;
  }
};

/**
 * Получить статистику Redis
 * @returns {Promise<object>}
 */
const getStats = async () => {
  try {
    const info = await redis.info('stats');
    const memory = await redis.info('memory');
    const keyspace = await redis.info('keyspace');

    return {
      info,
      memory,
      keyspace
    };
  } catch (error) {
    logger.error(`Ошибка получения статистики кэша: ${error.message}`);
    return null;
  }
};

/**
 * Ключи для кэширования
 */
const KEYS = {
  // Сессии
  SESSION: (userId) => `session:${userId}`,

  // Каталог
  CATEGORIES: 'catalog:categories',
  CATEGORIES_LIST: (params) => `catalog:categories:list:${JSON.stringify(params)}`,
  CATEGORY_BY_ID: (id) => `catalog:category:${id}`,

  // Услуги
  SERVICES: 'catalog:services',
  SERVICE_BY_ID: (id) => `catalog:service:${id}`,
  SERVICES_BY_CATEGORY: (categoryId, params) => `catalog:services:category:${categoryId}:${JSON.stringify(params)}`,

  // Мастера
  MASTERS: 'masters:list',
  MASTER_BY_ID: (id) => `master:${id}`,
  MASTER_SERVICES: (masterId) => `master:${masterId}:services`,
  MASTER_SCHEDULE: (masterId, date) => `master:${masterId}:schedule:${date}`,
  TOP_MASTERS: (limit, minRating) => `top_masters:${limit}:${minRating}`,

  // Поиск
  SEARCH_CATEGORIES: (query) => `search:categories:${query}`,
  SEARCH_SERVICES: (query) => `search:services:${query}`,
  SEARCH_MASTERS: (query) => `search:masters:${query}`
};

module.exports = {
  redis,
  cache: {
    get,
    set,
    del,
    clearByPattern,
    exists,
    getStats
  },
  CACHE_TTL,
  KEYS
};
