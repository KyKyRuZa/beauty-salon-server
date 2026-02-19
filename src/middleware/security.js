const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const xss = require('xss-clean');
const { createLogger } = require('./logger');

const logger = createLogger('security');


const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
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


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    success: false,
    message: 'Слишком много попыток входа, пожалуйста, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, 
  handler: (req, res) => {
    logger.warn('Rate limit аутентификации превышен', { ip: req.ip, url: req.url });
    res.status(429).json({
      success: false,
      message: 'Слишком много попыток входа, пожалуйста, попробуйте позже'
    });
  }
});


const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  message: {
    success: false,
    message: 'Слишком много запросов на создание, пожалуйста, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});


const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 
};


const applySecurityMiddleware = (app) => {
  
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

  
  app.use(cors(corsOptions));

  
  app.use('/api/', generalLimiter);

  
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  
  app.use('/api/catalog/', createLimiter);
  app.use('/api/booking/', createLimiter);

  
  app.use(xss());

  
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
