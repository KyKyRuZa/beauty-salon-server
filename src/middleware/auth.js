const jwt = require('jsonwebtoken');
const sessionService = require('../utils/sessionService');
const { createLogger } = require('../utils/logger');


const logger = createLogger('auth-middleware');


const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Требуется токен доступа', { url: req.url, method: req.method, ip: req.ip });
    return res.status(401).json({
      success: false,
      message: 'Требуется токен доступа'
    });
  }

  try {
    
    const session = await sessionService.getSession(token);

    if (session) {
      
      req.user = {
        userId: session.userId,
        id: session.userId,
        email: session.email,
        role: session.role,
        fromSession: true
      };

      logger.debug('Аутентификация через сессию Redis', {
        userId: session.userId,
        email: session.email,
        url: req.url,
        method: req.method,
        ip: req.ip
      });

      return next();
    }

    
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, user) => {
      if (err) {
        logger.warn('Неверный или просроченный токен', {
          url: req.url,
          method: req.method,
          ip: req.ip,
          error: err.message
        });
        return res.status(403).json({
          success: false,
          message: 'Неверный или просроченный токен'
        });
      }

      req.user = user;
      logger.debug('Аутентификация через JWT', {
        userId: user.userId || user.id,
        url: req.url,
        method: req.method,
        ip: req.ip
      });
      next();
    });
  } catch (error) {
    logger.error('Ошибка аутентификации', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Ошибка аутентификации'
    });
  }
};


const requireAdminRole = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Требуется токен доступа для доступа к админ-панели', { url: req.url, method: req.method, ip: req.ip });
    return res.status(401).json({
      success: false,
      message: 'Требуется токен доступа'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, user) => {
    if (err) {
      logger.warn('Неверный или просроченный токен при проверке доступа к админ-панели', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        error: err.message
      });
      return res.status(403).json({
        success: false,
        message: 'Неверный или просроченный токен'
      });
    }


    if (user.role !== 'admin' && user.role !== 'super_admin') {
      logger.warn('Доступ запрещен: недостаточно прав', {
        userId: user.userId || user.id,
        role: user.role,
        url: req.url,
        method: req.method,
        ip: req.ip
      });
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен: недостаточно прав'
      });
    }

    req.user = user;
    logger.info('Токен администратора успешно проверен', {
      userId: user.userId || user.id,
      role: user.role,
      url: req.url,
      method: req.method,
      ip: req.ip
    });
    next();
  });
};

module.exports = {
  authenticateToken,
  requireAdminRole
};