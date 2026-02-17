require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const { createLogger } = require('./utils/logger');
const logger = createLogger('modular-monolith-server');

const app = require('./app');

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});


io.use((socket, next) => {
  next();
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info('Сервер запущен на порте', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000"
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Необработанный отказ в:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Необработанное исключение:', error);
  process.exit(1);
});

module.exports = server;