const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validation');
const upload = require('../../../middleware/upload');
const {
  registerValidationSchema,
  loginValidationSchema,
  updateProfileValidationSchema
} = require('../../../validation');

// Auth routes
router.post('/register', validate(registerValidationSchema, 'body'), authController.register);
router.post('/login', validate(loginValidationSchema, 'body'), authController.login);

// Apply authentication to profile routes
router.use(authenticateToken);

router.get('/profile', authController.getProfile);
// Обновляем маршрут edit-profile для обработки multipart/form-data
router.put('/edit-profile', upload.single('avatar'), (req, res, next) => {
  console.log('Request body:', req.body); // Логируем тело запроса
  console.log('Request file:', req.file); // Логируем файл
  console.log('Request headers:', req.headers['content-type']); // Логируем тип контента

  // Если есть файл, добавляем его путь в тело запроса
  if (req.file) {
    req.body.avatar = req.file.path;
  }

  // Продолжаем без валидации в middleware, так как валидация будет в контроллере
  next();
}, authController.editProfile);

// Маршрут для изменения пароля
router.put('/change-password', validate(require('../../../validation').changePasswordValidationSchema, 'body'), authController.changePassword);

module.exports = router;