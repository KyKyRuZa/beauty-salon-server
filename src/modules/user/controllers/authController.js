const authService = require('../services/authService');
const userService = require('../services/userService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createLogger } = require('../../../utils/logger');
const { registerValidationSchema, updateProfileValidationSchema, changePasswordValidationSchema } = require('../../../validation');


const logger = createLogger('auth-controller');


const register = async (req, res) => {
  logger.info('Получен запрос на регистрацию', { ip: req.ip, userAgent: req.get('User-Agent') });

  try {
    const userData = req.body;


    const validatedUserData = registerValidationSchema.parse(userData);

    const user = await authService.register(validatedUserData);


    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    logger.info('Пользователь успешно зарегистрирован', { userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error) {
    logger.error('Ошибка регистрации пользователя', { error: error.message, ip: req.ip });


    if (error.isEmpty === false) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }


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
  logger.info('Получен запрос на вход', { ip: req.ip, userAgent: req.get('User-Agent') });

  try {
    const { email, password } = req.body;

    const user = await authService.login(email, password);

    if (!user) {
      logger.warn('Предоставлены неверные учетные данные', { email, ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Неверные учетные данные'
      });
    }


    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    logger.info('Вход пользователя успешен', { userId: user.id, email: user.email });

    res.status(200).json({
      success: true,
      message: 'Вход успешен',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error) {
    logger.error('Ошибка входа пользователя', { error: error.message, ip: req.ip });
    

    if (error.isEmpty === false) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getProfile = async (req, res) => {
  logger.info('Получен запрос на получение профиля', { userId: req.user.userId || req.user.id, ip: req.ip });

  try {
    const userId = req.user.userId || req.user.id;

    const profile = await userService.getProfile(userId);

    if (!profile) {
      logger.warn('Профиль пользователя не найден', { userId, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Профиль пользователя не найден'
      });
    }

    logger.info('Профиль пользователя успешно получен', { userId, ip: req.ip });

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Ошибка получения профиля', { error: error.message, userId: req.user.userId || req.user.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const editProfile = async (req, res) => {
  logger.info('Получен запрос на редактирование профиля', { 
    userId: req.user.userId || req.user.id, 
    ip: req.ip,
    hasFile: !!req.file,
    fileName: req.file ? req.file.originalname : undefined
  });

  try {
    const userId = req.user.userId || req.user.id;
    const profileData = req.body;


    const hasUpdateData = Object.keys(profileData).some(key => 
      key !== 'createProfile' && profileData[key] !== undefined && profileData[key] !== ''
    );


    const hasAvatarFile = req.file !== undefined;


    if (!hasUpdateData && !hasAvatarFile) {
      return res.status(400).json({
        success: false,
        message: 'Должно быть указано хотя бы одно поле для обновления'
      });
    }


    if (req.file) {
      profileData.avatar = req.file.path;
    }


    const profileDataForValidation = { ...profileData };
    


    if (typeof profileDataForValidation.avatar === 'string') {
      delete profileDataForValidation.avatar;
    }


    const { updateProfileValidationSchema } = require('../../../validation');
    

    let validatedProfileData;
    if (Object.keys(profileDataForValidation).length === 0 && req.file) {


      validatedProfileData = {};
    } else {
      validatedProfileData = updateProfileValidationSchema.parse(profileDataForValidation);
    }
    

    if (req.file) {
      validatedProfileData.avatar = req.file.path;
    }

    const updatedProfile = await userService.editProfile(userId, validatedProfileData);

    logger.info('Профиль успешно обновлен', { userId, ip: req.ip });

    res.status(200).json({
      success: true,
      message: 'Профиль успешно обновлен',
      data: updatedProfile
    });
  } catch (error) {
    logger.error('Ошибка обновления профиля', { error: error.message, userId: req.user.userId || req.user.id, ip: req.ip });


    if (error && error.issues) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных',
        errors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }


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


const changePassword = async (req, res) => {
  logger.info('Получен запрос на изменение пароля', { userId: req.user.userId || req.user.id, ip: req.ip });

  try {
    const userId = req.user.userId || req.user.id;
    const { currentPassword, newPassword } = req.body;


    const validatedData = changePasswordValidationSchema.parse(req.body);


    const user = await userService.findById(userId);
    if (!user) {
      logger.warn('Пользователь не найден для изменения пароля', { userId, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }


    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      logger.warn('Неверный текущий пароль при попытке изменения', { userId, ip: req.ip });
      return res.status(400).json({
        success: false,
        message: 'Неверный текущий пароль'
      });
    }


    const hashedNewPassword = await bcrypt.hash(newPassword, 10);


    await user.update({ password: hashedNewPassword });

    logger.info('Пароль успешно изменен', { userId, ip: req.ip });

    res.status(200).json({
      success: true,
      message: 'Пароль успешно изменен'
    });
  } catch (error) {
    logger.error('Ошибка изменения пароля', { error: error.message, userId: req.user.userId || req.user.id, ip: req.ip });


    if (error && error.issues) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных',
        errors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  editProfile,
  changePassword
};