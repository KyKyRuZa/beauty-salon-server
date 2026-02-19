const { cache, KEYS, CACHE_TTL } = require('./cacheService');
const { createLogger } = require('./logger');
const crypto = require('crypto');

const logger = createLogger('session-service');

/**
 * Сервис для управления сессиями пользователей в Redis
 * Время жизни сессии: 1 час
 */

/**
 * Создать новую сессию для пользователя
 * @param {Object} user - Данные пользователя
 * @returns {Promise<Object>} - { token, expiresAt }
 */
const createSession = async (user) => {
  try {
    // Генерируем уникальный токен сессии
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (CACHE_TTL.SESSION * 1000);

    const sessionData = {
      userId: user.id || user.userId,
      email: user.email,
      role: user.role,
      createdAt: Date.now(),
      expiresAt,
      lastActivity: Date.now()
    };

    // Сохраняем сессию в Redis
    await cache.set(KEYS.SESSION(token), sessionData, CACHE_TTL.SESSION);

    logger.info(`Сессия создана для пользователя ${sessionData.email} (токен: ${token.substring(0, 8)}...)`);

    return {
      token,
      expiresAt,
      expiresIn: CACHE_TTL.SESSION
    };
  } catch (error) {
    logger.error(`Ошибка создания сессии: ${error.message}`);
    throw error;
  }
};

/**
 * Получить сессию по токену
 * @param {string} token - Токен сессии
 * @returns {Promise<Object|null>} - Данные сессии или null
 */
const getSession = async (token) => {
  try {
    if (!token) {
      return null;
    }

    const session = await cache.get(KEYS.SESSION(token));

    if (!session) {
      logger.debug(`Сессия не найдена для токена: ${token?.substring(0, 8)}...`);
      return null;
    }

    // Проверяем, не истекла ли сессия
    if (Date.now() > session.expiresAt) {
      logger.info(`Сессия истекла для пользователя ${session.email}`);
      await destroySession(token);
      return null;
    }

    // Обновляем время последней активности
    session.lastActivity = Date.now();
    await cache.set(KEYS.SESSION(token), session, CACHE_TTL.SESSION);

    return session;
  } catch (error) {
    logger.error(`Ошибка получения сессии: ${error.message}`);
    return null;
  }
};

/**
 * Обновить сессию (продлить время жизни)
 * @param {string} token - Токен сессии
 * @returns {Promise<boolean>}
 */
const renewSession = async (token) => {
  try {
    const session = await getSession(token);

    if (!session) {
      return false;
    }

    // Продлеваем сессию
    session.expiresAt = Date.now() + (CACHE_TTL.SESSION * 1000);
    session.lastActivity = Date.now();

    await cache.set(KEYS.SESSION(token), session, CACHE_TTL.SESSION);

    logger.debug(`Сессия обновлена для пользователя ${session.email}`);

    return true;
  } catch (error) {
    logger.error(`Ошибка обновления сессии: ${error.message}`);
    return false;
  }
};

/**
 * Уничтожить сессию (logout)
 * @param {string} token - Токен сессии
 * @returns {Promise<boolean>}
 */
const destroySession = async (token) => {
  try {
    if (!token) {
      return false;
    }

    const session = await cache.get(KEYS.SESSION(token));

    if (session) {
      await cache.del(KEYS.SESSION(token));
      logger.info(`Сессия уничтожена для пользователя ${session.email}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`Ошибка уничтожения сессии: ${error.message}`);
    return false;
  }
};

/**
 * Уничтожить все сессии пользователя
 * @param {number} userId - ID пользователя
 * @returns {Promise<number>} - Количество удаленных сессий
 */
const destroyAllUserSessions = async (userId) => {
  try {
    // В текущей реализации у пользователя одна сессия
    // Можно расширить для поддержки нескольких сессий
    const pattern = `session:*`;
    const keys = await redis.keys(pattern);

    let deletedCount = 0;
    for (const key of keys) {
      const session = await cache.get(key);
      if (session && (session.userId === userId || session.id === userId)) {
        await cache.del(key);
        deletedCount++;
      }
    }

    logger.info(`Уничтожено ${deletedCount} сессий для пользователя ${userId}`);

    return deletedCount;
  } catch (error) {
    logger.error(`Ошибка уничтожения сессий пользователя: ${error.message}`);
    return 0;
  }
};

/**
 * Получить статистику сессий
 * @returns {Promise<Object>}
 */
const getSessionStats = async () => {
  try {
    const pattern = `session:*`;
    const keys = await redis.keys(pattern);

    let activeSessions = 0;
    let expiredSessions = 0;
    const sessionsByRole = {};

    for (const key of keys) {
      const session = await cache.get(key);
      if (session) {
        if (Date.now() > session.expiresAt) {
          expiredSessions++;
        } else {
          activeSessions++;
          sessionsByRole[session.role] = (sessionsByRole[session.role] || 0) + 1;
        }
      }
    }

    return {
      activeSessions,
      expiredSessions,
      sessionsByRole,
      totalKeys: keys.length
    };
  } catch (error) {
    logger.error(`Ошибка получения статистики сессий: ${error.message}`);
    return null;
  }
};

// Импортируем redis из cacheService
const { redis } = require('./cacheService');

module.exports = {
  createSession,
  getSession,
  renewSession,
  destroySession,
  destroyAllUserSessions,
  getSessionStats,
  SESSION_TTL: CACHE_TTL.SESSION
};
