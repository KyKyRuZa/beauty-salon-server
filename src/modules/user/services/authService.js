const User = require('../models/User');
const Client = require('../models/Client');
const Master = require('../models/Master');
const Salon = require('../models/Salon');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sequelize } = require('../../../config/database');
const { createLogger } = require('../../../utils/logger');

// Create a logger instance for this service
const logger = createLogger('auth-service');

// Register a new user
const register = async (userData) => {
  logger.info('Регистрация нового пользователя', { email: userData.email, role: userData.role });

  const { phone, email, password, role } = userData;
  
  // Extract profile data fields from userData
  const { profileData, first_name, last_name, ...userDataWithoutProfile } = userData;

  const transaction = await sequelize.transaction();

  try {
    // Check if phone or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { phone },
          { email }
        ]
      }
    });

    if (existingUser) {
      logger.warn('Номер телефона или email уже существуют', { phone, email });
      throw new Error('Номер телефона или email уже существуют');
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the user
    const user = await User.create({
      phone,
      email,
      password: hashedPassword,
      role
    }, { transaction });

    logger.info('Пользователь создан', { userId: user.id, role });

    // Create corresponding profile based on role
    switch (role) {
      case 'client':
        await Client.create({
          user_id: user.id,
          ...(profileData || {}),
          ...(first_name && { first_name }),
          ...(last_name && { last_name })
        }, { transaction });
        logger.info('Профиль клиента создан', { userId: user.id });
        break;
      case 'master':
        await Master.create({
          user_id: user.id,
          ...(profileData || {}),
          ...(first_name && { first_name }),
          ...(last_name && { last_name })
        }, { transaction });
        logger.info('Профиль мастера создан', { userId: user.id });
        break;
      case 'salon':
        await Salon.create({
          user_id: user.id,
          ...(profileData || {}),
          ...(first_name && { first_name }),
          ...(last_name && { last_name })
        }, { transaction });
        logger.info('Профиль салона создан', { userId: user.id });
        break;
      default:
        logger.error('Указана неверная роль', { role });
        throw new Error('Указана неверная роль');
    }

    await transaction.commit();
    logger.info('Регистрация пользователя успешно завершена', { userId: user.id });

    // Return user without password
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted
    };

    return userWithoutPassword;
  } catch (error) {
    logger.error('Ошибка регистрации пользователя', { error: error.message });
    await transaction.rollback();
    throw error;
  }
};

// Login user
const login = async (email, password) => {
  logger.info('Попытка входа пользователя', { email });

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    logger.warn('Пользователь не найден при входе', { email });
    throw new Error('Пользователь не найден');
  }

  if (!user.isActive) {
    logger.warn('Аккаунт деактивирован', { userId: user.id, email });
    throw new Error('Аккаунт деактивирован');
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    logger.warn('Предоставлен неверный пароль', { userId: user.id, email });
    throw new Error('Неверный пароль');
  }

  logger.info('Вход пользователя успешен', { userId: user.id, email });

  // Return user without password
  const userWithoutPassword = {
    id: user.id,
    email: user.email,
    role: user.role,
    profileCompleted: user.profileCompleted
  };

  return userWithoutPassword;
};

module.exports = {
  register,
  login
};