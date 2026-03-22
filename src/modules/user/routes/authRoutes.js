const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validation');
const upload = require('../../../middleware/upload');
const { createLogger } = require('../../../utils/logger');
const {
  registerValidationSchema,
  loginValidationSchema,
  updateProfileValidationSchema,
} = require('../../../validation');

const logger = createLogger('auth-routes');

router.post('/register', validate(registerValidationSchema, 'body'), authController.register);
router.post('/login', validate(loginValidationSchema, 'body'), authController.login);
router.post('/logout', authController.logout);

router.use(authenticateToken);

router.get('/profile', authController.getProfile);

router.put(
  '/edit-profile',
  upload.single('avatar'),
  validate(updateProfileValidationSchema, 'body'),
  (req, res, next) => {
    logger.debug('Edit profile request', {
      body: req.body,
      file: req.file,
      contentType: req.headers['content-type'],
    });

    if (req.file) {
      // Делаем путь относительным (убираем /app/ если есть)
      req.body.avatar = req.file.path.replace('/app/', '');
    }

    next();
  },
  authController.editProfile
);

router.put(
  '/change-password',
  validate(require('../../../validation').changePasswordValidationSchema, 'body'),
  authController.changePassword
);

module.exports = router;
