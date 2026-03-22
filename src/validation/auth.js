const { z } = require('zod');
const { BaseValidationSchema } = require('./base');

const { email, password, phone, name } = BaseValidationSchema;

/**
 * Схемы валидации для авторизации
 */

const loginValidationSchema = z.object({
  body: z.object({
    email: email,
    password: password,
  }),
});

const registerValidationSchema = z.object({
  body: z.object({
    email: email,
    password: password,
    phone: phone,
    first_name: name.optional(),
    last_name: name.optional(),
  }),
});

const updateProfileValidationSchema = z.object({
  body: z.object({
    first_name: name.optional(),
    last_name: name.optional(),
    phone: phone.optional(),
    email: email.optional(),
  }),
});

const changePasswordValidationSchema = z.object({
  body: z.object({
    current_password: password,
    new_password: password,
  }),
});

module.exports = {
  loginValidationSchema,
  registerValidationSchema,
  updateProfileValidationSchema,
  changePasswordValidationSchema,
};
