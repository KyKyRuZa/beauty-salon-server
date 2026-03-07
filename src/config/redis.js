const Redis = require('ioredis');
const { createLogger } = require('../utils/logger');

const logger = createLogger('redis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  commandTimeout: 5000,
  // Оптимизация для сессий
  keepAlive: 300000, // 5 минут keep-alive
  family: 4 // IPv4 для стабильности
};

const redis = new Redis(redisConfig);

redis.on('error', (err) => {
  logger.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', (delay) => {
  logger.info(`Redis reconnecting in ${delay}ms`);
});

// Логирование состояния подключения при старте
logger.info('📡 Redis конфигурация:', {
  host: redisConfig.host,
  port: redisConfig.port,
  db: redisConfig.db,
  lazyConnect: redisConfig.lazyConnect
});

redis.connect().catch((err) => {
  logger.error('Failed to connect to Redis:', err.message);
});

module.exports = redis;
