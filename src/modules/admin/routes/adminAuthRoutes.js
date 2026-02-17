const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/adminAuthController');
const { validate } = require('../../../middleware/validation');
const {
  adminRegisterValidationSchema,
  adminLoginValidationSchema
} = require('../../../validation');


router.post('/register', validate(adminRegisterValidationSchema, 'body'), register);
router.post('/login', validate(adminLoginValidationSchema, 'body'), login);

module.exports = router;