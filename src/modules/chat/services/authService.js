const User = require('../models/User');
const bcrypt = require('bcrypt');
const { createLogger } = require('../../../utils/logger');

// Create a logger instance for this service
const logger = createLogger('chat-auth-service');

// Register a new user
const register = async (userData) => {
  logger.info('Попытка регистрации пользователя чата', { username: userData.username, email: userData.email });

  const { username, password, email } = userData;

  // Check if username already exists
  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) {
    logger.warn('Имя пользователя уже существует', { username });
    throw new Error('Имя пользователя уже существует');
  }

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create the user
  const user = await User.create({
    username,
    password: hashedPassword,
    email
  });

  logger.info('Пользователь чата успешно создан', { userId: user.id, username: user.username });

  // Return user without password
  const userWithoutPassword = {
    id: user.id,
    username: user.username,
    email: user.email
  };

  return userWithoutPassword;
};

// Login user
const login = async (username, password) => {
  logger.info('Попытка входа пользователя чата', { username });

  // Find user by username
  const user = await User.findOne({ where: { username } });
  if (!user) {
    logger.warn('Пользователь чата не найден при входе', { username });
    throw new Error('Пользователь не найден');
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    logger.warn('Предоставлен неверный пароль для пользователя чата', { userId: user.id, username });
    throw new Error('Неверный пароль');
  }

  logger.info('Вход пользователя чата успешен', { userId: user.id, username });

  // Return user without password
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