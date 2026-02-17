const { z } = require('zod');
const { BaseValidationSchema } = require('./base');

// Схема валидации для регистрации администратора
const adminRegisterValidationSchema = z.object({
  email: BaseValidationSchema.email,
  password: BaseValidationSchema.password,
  phone: BaseValidationSchema.phone,
  first_name: BaseValidationSchema.name.optional(),
  last_name: BaseValidationSchema.name.optional(),
  role: z.enum(['admin', 'super_admin', 'moderator'], {
    errorMap: () => ({ message: 'Role must be admin, super_admin, or moderator' })
  }).default('admin'),
  is_active: z.boolean().default(true),
});

// Схема валидации для входа администратора
const adminLoginValidationSchema = z.object({
  email: BaseValidationSchema.email,
  password: z.string().min(1, 'Пароль обязателен'),
});

module.exports = {
  adminRegisterValidationSchema,
  adminLoginValidationSchema,
};