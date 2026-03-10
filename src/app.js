const express = require('express');
const compression = require('compression');
const { createLogger } = require('./utils/logger');
const { applySecurityMiddleware } = require('./middleware/security');
require('dotenv').config();

const logger = createLogger('modular-monolith-app');

const { connectDB, sequelize } = require('./config/database');
const redis = require('./config/redis');

const userAuthRoutes = require('./modules/user/routes/authRoutes');
const serviceRoutes = require('./modules/user/routes/serviceRoutes');
const providerRoutes = require('./modules/user/routes/providerRoutes');
const salonLocationRoutes = require('./modules/user/routes/salonLocationRoutes');
const reviewRoutes = require('./modules/user/routes/reviewRoutes');
const favoriteRoutes = require('./modules/user/routes/favoriteRoutes');
const bookingRoutes = require('./modules/booking/routes/bookingRoutes');
const timeslotRoutes = require('./modules/booking/routes/timeslotRoutes');
const availabilityRoutes = require('./modules/booking/routes/availabilityRoutes');
const catalogRoutes = require('./modules/catalog/routes/catalogRoutes');
const adminRoutes = require('./modules/admin/routes/adminRoutes');
const geoRoutes = require('./modules/geo/routes/geoRoutes');
const adminAuthRoutes = require('./modules/admin/routes/adminAuthRoutes');

const app = express();

// Gzip сжатие для всех ответов (включая dev)
app.use(compression({
  level: 6, // Уровень сжатия (1-9, по умолчанию 6)
  threshold: 1024, // Сжимать только ответы > 1KB
  filter: (req, res) => {
    // Не сжимать SSE (Server-Sent Events)
    if (req.headers['accept']?.includes('text/event-stream')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

connectDB()
  .then(() => {
    logger.info('База данных успешно инициализирована');
  })
  .catch(error => {
    logger.error('Ошибка инициализации базы данных:', error);
  });


applySecurityMiddleware(app);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static('uploads'));


app.use((req, res, next) => {
  if (
    !req.path.startsWith('/health') && 
    !req.path.match(/\.(js|css|png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf|eot)$/)
  ) {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
  next();
});


app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/auth', userAuthRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/salon-locations', salonLocationRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/timeslots', timeslotRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', async (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'unknown', message: '' },
      redis: { status: 'unknown', message: '' }
    }
  };

  let overallStatus = 'healthy';

  // Проверка PostgreSQL
  try {
    await sequelize.authenticate();
    healthStatus.services.database.status = 'connected';
    healthStatus.services.database.message = 'База данных доступна';
  } catch (error) {
    healthStatus.services.database.status = 'disconnected';
    healthStatus.services.database.message = `Ошибка подключения: ${error.message}`;
    overallStatus = 'unhealthy';
  }

  // Проверка Redis
  try {
    await redis.ping();
    healthStatus.services.redis.status = 'connected';
    healthStatus.services.redis.message = 'Redis доступен';
  } catch (error) {
    healthStatus.services.redis.status = 'disconnected';
    healthStatus.services.redis.message = `Ошибка подключения: ${error.message}`;
    overallStatus = 'unhealthy';
  }

  const httpStatus = overallStatus === 'healthy' ? 200 : 503;
  healthStatus.status = overallStatus === 'healthy' ? 'OK' : 'DEGRADED';

  logger.info(`Health check: ${overallStatus}`, {
    database: healthStatus.services.database.status,
    redis: healthStatus.services.redis.status
  });

  res.status(httpStatus).json(healthStatus);
});

app.use((err, req, res, next) => {
  logger.error('Произошла ошибка:', { error: err.message, stack: err.stack, url: req.url, method: req.method });
  res.status(500).json({
    success: false,
    message: 'Что-то пошло не так!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.use((req, res) => {
  logger.warn('Маршрут не найден', { url: req.url, method: req.method });
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден'
  });
});

module.exports = app;