const User = require('../../user/models/User');
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sequelize } = require('../../../config/database');
const { createLogger } = require('../../../utils/logger');


const logger = createLogger('admin-auth-service');


const registerAdmin = async (adminData) => {
  logger.info('Регистрация нового администратора', { email: adminData.email });

  const { phone, email, password } = adminData;

  logger.info('Данные для регистрации администратора', { phone, email, hasPassword: !!password });

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

    logger.info('Проверка существования пользователя пройдена', { email, phone });

    logger.info('Создание пользователя с паролем', { userId: 'new_user', email });



    const user = await User.create({
      phone,
      email,
      password,
      role: 'admin'
    }, { transaction });

    logger.info('Пользователь создан с хешированным паролем', { userId: user.id, email: user.email });

    logger.info('Пользователь с ролью администратора создан', { userId: user.id, email: user.email, role: user.role });


    const admin = await Admin.create({
      user_id: user.id,
      role: 'admin',
      first_name: adminData.firstName || null,
      last_name: adminData.lastName || null,
      is_active: true
    }, { transaction });

    logger.info('Запись администратора создана', { adminId: admin.id, userId: user.id, role: admin.role });

    await transaction.commit();
    logger.info('Регистрация администратора успешно завершена', { userId: user.id, adminId: admin.id });


    const adminDataResponse = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted
      },
      admin: {
        id: admin.id,
        role: admin.role,
        is_active: admin.is_active
      }
    };

    return adminDataResponse;
  } catch (error) {
    logger.error('Ошибка регистрации администратора', { error: error.message });
    await transaction.rollback();
    throw error;
  }
};


const loginAdmin = async (email, password) => {
  logger.info('Попытка входа администратора', { email });


  const user = await User.findOne({ where: { email } });
  if (!user) {
    logger.warn('Пользователь не найден при входе администратора', { email });
    throw new Error('Пользователь не найден');
  }

  logger.info('Найден пользователь', { userId: user.id, email: user.email, role: user.role, isActive: user.isActive });

  if (!user.isActive) {
    logger.warn('Аккаунт администратора деактивирован', { userId: user.id, email });
    throw new Error('Аккаунт деактивирован');
  }


  const admin = await Admin.findOne({ where: { user_id: user.id, is_active: true } });
  if (!admin) {
    logger.warn('Пользователь не является администратором', { userId: user.id, email, role: user.role });
    throw new Error('Пользователь не является администратором');
  }

  logger.info('Найдена запись администратора', { adminId: admin.id, userId: user.id, adminRole: admin.role });


  logger.info('Проверка пароля', { userId: user.id });
  const isValidPassword = await bcrypt.compare(password, user.password);
  logger.info('Результат проверки пароля', { userId: user.id, isValidPassword });

  if (!isValidPassword) {
    logger.warn('Предоставлен неверный пароль для администратора', { userId: user.id, email });
    throw new Error('Неверный пароль');
  }

  logger.info('Вход администратора успешен', { userId: user.id, email });


  const adminDataResponse = {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted
    },
    admin: {
      id: admin.id,
      role: admin.role,
      is_active: admin.is_active
    }
  };

  return adminDataResponse;
};

module.exports = {
  registerAdmin,
  loginAdmin
};