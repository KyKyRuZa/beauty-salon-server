const User = require('../models/User');
const bcrypt = require('bcrypt');
const { createLogger } = require('../../../utils/logger');


const logger = createLogger('chat-auth-service');


const register = async (userData) => {
  logger.info('Попытка регистрации пользователя чата', { username: userData.username, email: userData.email });

  const { username, password, email } = userData;


  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) {
    logger.warn('Имя пользователя уже существует', { username });
    throw new Error('Имя пользователя уже существует');
  }


  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);


  const user = await User.create({
    username,
    password: hashedPassword,
    email
  });

  logger.info('Пользователь чата успешно создан', { userId: user.id, username: user.username });


  const userWithoutPassword = {
    id: user.id,
    username: user.username,
    email: user.email
  };

  return userWithoutPassword;
};


const login = async (username, password) => {
  logger.info('Попытка входа пользователя чата', { username });


  const user = await User.findOne({ where: { username } });
  if (!user) {
    logger.warn('Пользователь чата не найден при входе', { username });
    throw new Error('Пользователь не найден');
  }


  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    logger.warn('Предоставлен неверный пароль для пользователя чата', { userId: user.id, username });
    throw new Error('Неверный пароль');
  }

  logger.info('Вход пользователя чата успешен', { userId: user.id, username });


  const userWithoutPassword = {
    id: user.id,
    username: user.username,
    email: user.email
  };

  return userWithoutPassword;
};

module.exports = {
  register,
  login
};