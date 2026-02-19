const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const xss = require('xss-clean');
const { createLogger } = require('./logger');

const logger = createLogger('security');

// Rate limiting для всех запросов
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // Максимум 100 запросов с одного IP
  message: {
    success: false,
    message: 'Слишком много запросов, пожалуйста, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit превышен', { ip: req.ip, url: req.url });
    res.status(429).json({
      success: false,
      message: 'Слишком много запросов, пожалуйста, попробуйте позже'
    });
  }
});

// Усиленный rate limiting для аутентификации (защита от brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // Максимум 10 попыток входа
  message: {
    success: false,
    message: 'Слишком много попыток входа, пожалуйста, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Считаем и успешные и неудачные запросы
  handler: (req, res) => {
    logger.warn('Rate limit аутентификации превышен', { ip: req.ip, url: req.url });
    res.status(429).json({
      success: false,
      message: 'Слишком много попыток входа, пожалуйста, попробуйте позже'
    });
  }
});

// Rate limiting для создания ресурсов (защита от спама)
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20, // Максимум 20 запросов на создание
  message: {
    success: false,
    message: 'Слишком много запросов на создание, пожалуйста, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Настройка CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 часа
};

/**
 * Применить все middleware безопасности к приложению
 * @param {Express} app - Express приложение
 */
const applySecurityMiddleware = (app) => {
  // Helmet - защитные HTTP заголовки
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.API_URL || "http://localhost:5000"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "same-origin" }
  }));

  // CORS
  app.use(cors(corsOptions));

  // Rate limiting для всех запросов
  app.use('/api/', generalLimiter);

  // Усиленный rate limiting для аутентификации
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  // Rate limiting для создания ресурсов
  app.use('/api/catalog/', createLimiter);
  app.use('/api/booking/', createLimiter);

  // XSS protection
  app.use(xss());

  // HPP protection (защита от загрязнения параметров HTTP)
  app.use(hpp());

  logger.info('✅ Middleware безопасности применены');
};

module.exports = {
  applySecurityMiddleware,
  generalLimiter,
  authLimiter,
  createLimiter,
  corsOptions
};
