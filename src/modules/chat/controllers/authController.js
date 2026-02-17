const authService = require('../services/authService');
const jwt = require('jsonwebtoken');


const register = async (req, res) => {
  try {
    const userData = req.body;


    if (!userData.username || !userData.password) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать имя пользователя и пароль'
      });
    }


    if (userData.username.length < 3 || userData.username.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Имя пользователя должно содержать от 3 до 50 символов'
      });
    }


    const usernameRegex = /^[A-Za-z0-9]+$/;
    if (!usernameRegex.test(userData.username)) {
      return res.status(400).json({
        success: false,
        message: 'Имя пользователя может содержать только буквы и цифры'
      });
    }


    if (userData.password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать не менее 6 символов'
      });
    }


    if (userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return res.status(400).json({
          success: false,
          message: 'Пожалуйста, введите действительный адрес электронной почты'
        });
      }
    }

    const user = await authService.register(userData);


    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {

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
  try {
    const { username, password } = req.body;
    
    const user = await authService.login(username, password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
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