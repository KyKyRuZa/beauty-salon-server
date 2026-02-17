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


router.post('/register', validate(registerValidationSchema, 'body'), authController.register);
router.post('/login', validate(loginValidationSchema, 'body'), authController.login);


router.use(authenticateToken);

router.get('/profile', authController.getProfile);

router.put('/edit-profile', upload.single('avatar'), (req, res, next) => {
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  console.log('Request headers:', req.headers['content-type']);


  if (req.file) {
    req.body.avatar = req.file.path;
  }


  next();
}, authController.editProfile);


router.put('/change-password', validate(require('../../../validation').changePasswordValidationSchema, 'body'), authController.changePassword);

module.exports = router;