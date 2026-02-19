const express = require('express');
const { createLogger } = require('./utils/logger');
const { applySecurityMiddleware } = require('./middleware/security');
require('dotenv').config();

const logger = createLogger('modular-monolith-app');

const { connectDB } = require('./config/database');

const userAuthRoutes = require('./modules/user/routes/authRoutes');
const serviceRoutes = require('./modules/user/routes/serviceRoutes');
const providerRoutes = require('./modules/user/routes/providerRoutes');
const reviewRoutes = require('./modules/user/routes/reviewRoutes');
const favoriteRoutes = require('./modules/user/routes/favoriteRoutes');
const bookingRoutes = require('./modules/booking/routes/bookingRoutes');
const timeslotRoutes = require('./modules/booking/routes/timeslotRoutes');
const availabilityRoutes = require('./modules/booking/routes/availabilityRoutes');
const catalogRoutes = require('./modules/catalog/routes/catalogRoutes');
const adminRoutes = require('./modules/admin/routes/adminRoutes');
const adminAuthRoutes = require('./modules/admin/routes/adminAuthRoutes');

const app = express();

connectDB()
  .then(() => {
    logger.info('База данных успешно инициализирована');
  })
  .catch(error => {
    logger.error('Ошибка инициализации базы данных:', error);
  });

// Применение middleware безопасности
applySecurityMiddleware(app);

// Парсинг JSON и URL-encoded данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static('uploads'));


app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});


app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/auth', userAuthRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/timeslots', timeslotRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/admin', adminRoutes);


app.get('/health', (req, res) => {
  logger.info('Вызван эндпоинт проверки работоспособности');
  res.status(200).json({ status: 'OK', message: 'Сервер запущен' });
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