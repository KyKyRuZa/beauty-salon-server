const User = require('../models/User');
const Client = require('../models/Client');
const Master = require('../models/Master');
const Salon = require('../models/Salon');
const sessionService = require('../../../utils/sessionService');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sequelize } = require('../../../config/database');
const { createLogger } = require('../../../utils/logger');


const logger = createLogger('auth-service');


const register = async (userData) => {
  logger.info('Регистрация нового пользователя', { email: userData.email, role: userData.role });

  const { phone, email, password, role } = userData;
  

  const { profileData, first_name, last_name, ...userDataWithoutProfile } = userData;

  const transaction = await sequelize.transaction();

  try {

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


    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);


    const user = await User.create({
      phone,
      email,
      password: hashedPassword,
      role
    }, { transaction });

    logger.info('Пользователь создан', { userId: user.id, role });


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


const login = async (email, password) => {
  logger.info('Попытка входа пользователя', { email });


  const user = await User.findOne({ where: { email } });
  if (!user) {
    logger.warn('Пользователь не найден при входе', { email });
    throw new Error('Пользователь не найден');
  }

  if (!user.isActive) {
    logger.warn('Аккаунт деактивирован', { userId: user.id, email });
    throw new Error('Аккаунт деактивирован');
  }


  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    logger.warn('Предоставлен неверный пароль', { userId: user.id, email });
    throw new Error('Неверный пароль');
  }

  logger.info('Вход пользователя успешен', { userId: user.id, email });


  const userWithoutPassword = {
    id: user.id,
    email: user.email,
    role: user.role,
    profileCompleted: user.profileCompleted
  };

  return userWithoutPassword;
};

/**
 * Вход пользователя с созданием сессии в Redis
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} - { user, session: { token, expiresAt, expiresIn } }
 */
const loginWithSession = async (email, password) => {
  logger.info('Попытка входа с созданием сессии', { email });

  // Выполняем обычный вход
  const user = await login(email, password);

  // Создаем сессию в Redis
  const session = await sessionService.createSession(user);

  logger.info('Сессия создана', { userId: user.id, email, sessionId: session.token.substring(0, 8) + '...' });

  return {
    user,
    session
  };
};

module.exports = {
  register,
  login,
  loginWithSession
};