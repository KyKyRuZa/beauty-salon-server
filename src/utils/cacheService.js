const redis = require('../config/redis');
const { createLogger } = require('./logger');

const logger = createLogger('cache-service');

/**
 * Время жизни кэша (TTL) в секундах
 */
const CACHE_TTL = {
  SESSION: 3600,           // 1 час
  CATALOG: 300,            // 5 минут
  SERVICES: 300,           // 5 минут
  CATEGORIES: 600,         // 10 минут
  MASTERS: 300,            // 5 минут
  MASTER_SERVICES: 300,    // 5 минут
  SEARCH: 180              // 3 минуты
};

/**
 * Получить значение из кэша
 * @param {string} key - Ключ
 * @returns {Promise<any>} - Значение или null
 */
const get = async (key) => {
  try {
    const value = await redis.get(key);
    if (value) {
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(value);
    }
    logger.debug(`Cache MISS: ${key}`);
    return null;
  } catch (error) {
    logger.error(`Cache get error: ${error.message}`);
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
    logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    logger.error(`Cache set error: ${error.message}`);
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
    logger.debug(`Cache DEL: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Cache del error: ${error.message}`);
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
      logger.debug(`Cache CLEAR: ${keys.length} keys by pattern ${pattern}`);
    }
    return true;
  } catch (error) {
    logger.error(`Cache clear error: ${error.message}`);
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
    logger.error(`Cache exists error: ${error.message}`);
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
    logger.error(`Cache stats error: ${error.message}`);
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
  CATEGORY_BY_ID: (id) => `catalog:category:${id}`,
  
  // Услуги
  SERVICES: 'catalog:services',
  SERVICE_BY_ID: (id) => `catalog:service:${id}`,
  SERVICES_BY_CATEGORY: (categoryId) => `catalog:services:category:${categoryId}`,
  
  // Мастера
  MASTERS: 'masters:list',
  MASTER_BY_ID: (id) => `master:${id}`,
  MASTER_SERVICES: (masterId) => `master:${masterId}:services`,
  MASTER_SCHEDULE: (masterId, date) => `master:${masterId}:schedule:${date}`,
  
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
