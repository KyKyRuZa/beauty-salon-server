require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const { createLogger } = require('./utils/logger');
const logger = createLogger('modular-monolith-server');

const app = require('./app');
const { sequelize } = require('./config/database');
const redis = require('./config/redis');

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

io.use((socket, next) => {
  next();
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info('Сервер запущен', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  });
});

/**
 * Graceful shutdown - корректное завершение работы
 */
const gracefulShutdown = async (signal) => {
  logger.info(`Получен сигнал ${signal}, завершение работы...`);

  // Закрываем HTTP сервер
  server.close(async () => {
    logger.info('HTTP сервер закрыт');

    try {
      // Закрываем соединение с БД
      await sequelize.close();
      logger.info('Соединение с БД закрыто');

      // Закрываем Redis
      await redis.quit();
      logger.info('Redis отключен');

      // Закрываем WebSocket
      io.close();
      logger.info('WebSocket закрыт');

      logger.info('Завершение работы выполнено успешно');
      process.exit(0);
    } catch (error) {
      logger.error('Ошибка при завершении работы:', error);
      process.exit(1);
    }
  });

  // Принудительное завершение через 30 секунд
  setTimeout(() => {
    logger.error('Принудительное завершение работы (timeout 30s)');
    process.exit(1);
  }, 30000);
};

// Обработка сигналов завершения
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Необработанный отказ в:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Необработанное исключение:', error);
  process.exit(1);
});

module.exports = server;
