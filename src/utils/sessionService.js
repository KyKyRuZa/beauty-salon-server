const { cache, KEYS, CACHE_TTL } = require('./cacheService');
const { createLogger } = require('./logger');
const crypto = require('crypto');

const logger = createLogger('session-service');




const createSession = async (user) => {
  try {
    
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

    
    if (Date.now() > session.expiresAt) {
      logger.info(`Сессия истекла для пользователя ${session.email}`);
      await destroySession(token);
      return null;
    }

    
    session.lastActivity = Date.now();
    await cache.set(KEYS.SESSION(token), session, CACHE_TTL.SESSION);

    return session;
  } catch (error) {
    logger.error(`Ошибка получения сессии: ${error.message}`);
    return null;
  }
};


const renewSession = async (token) => {
  try {
    const session = await getSession(token);

    if (!session) {
      return false;
    }

    
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


const destroyAllUserSessions = async (userId) => {
  try {
    
    
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
