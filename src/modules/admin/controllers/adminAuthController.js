const adminAuthService = require('../services/adminAuthService');
const jwt = require('jsonwebtoken');
const { createLogger } = require('../../../utils/logger');


const logger = createLogger('admin-auth-controller');


const register = async (req, res) => {
  logger.info('Получен запрос на регистрацию администратора', { ip: req.ip, userAgent: req.get('User-Agent') });

  try {
    const adminData = req.body;


    if (!adminData.email || !adminData.password || !adminData.phone || !adminData.first_name || !adminData.last_name) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать email, password, phone, first_name и last_name'
      });
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, введите действительный адрес электронной почту'
      });
    }


    if (adminData.password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать не менее 6 символов'
      });
    }


    const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
    if (!phoneRegex.test(adminData.phone)) {
      return res.status(400).json({
        success: false,
        message: 'Номер телефона должен содержать не менее 10 символов и может включать цифры, пробелы, дефисы и скобки'
      });
    }


    if (adminData.first_name.length < 2 || adminData.first_name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Имя должно содержать от 2 до 100 символов'
      });
    }


    if (adminData.last_name.length < 2 || adminData.last_name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Фамилия должна содержать от 2 до 100 символов'
      });
    }

    const admin = await adminAuthService.registerAdmin(adminData);


    const token = jwt.sign(
      { userId: admin.user.id, email: admin.user.email, role: admin.user.role },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    logger.info('Администратор успешно зарегистрирован', { userId: admin.user.id, email: admin.user.email });

    res.status(201).json({
      success: true,
      message: 'Администратор успешно зарегистрирован',
      token,
      user: {
        id: admin.user.id,
        email: admin.user.email,
        role: admin.user.role,
        profileCompleted: admin.user.profileCompleted
      }
    });
  } catch (error) {
    logger.error('Ошибка регистрации администратора', { error: error.message, ip: req.ip });


    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных: ' + error.message
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const login = async (req, res) => {
  logger.info('Получен запрос на вход администратора', { ip: req.ip, userAgent: req.get('User-Agent') });

  try {
    const { email, password } = req.body;

    const admin = await adminAuthService.loginAdmin(email, password);

    if (!admin) {
      logger.warn('Предоставлены неверные учетные данные администратора', { email, ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Неверные учетные данные'
      });
    }


    const token = jwt.sign(
      { userId: admin.user.id, email: admin.user.email, role: admin.user.role },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    logger.info('Вход администратора успешен', { userId: admin.user.id, email: admin.user.email });

    res.status(200).json({
      success: true,
      message: 'Вход успешен',
      token,
      user: {
        id: admin.user.id,
        email: admin.user.email,
        role: admin.user.role,
        profileCompleted: admin.user.profileCompleted
      }
    });
  } catch (error) {
    logger.error('Ошибка входа администратора', { error: error.message, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  register,
  login
};