const { z } = require('zod');
const { BaseValidationSchema } = require('./base');


const registerValidationSchema = z.object({
  email: BaseValidationSchema.email,
  password: BaseValidationSchema.password,
  phone: BaseValidationSchema.phone,
  role: BaseValidationSchema.role,
  isActive: z.boolean().optional(),
});


const loginValidationSchema = z.object({
  email: BaseValidationSchema.email,
  password: z.string().min(1, 'Пароль обязателен'),
});


const updateProfileValidationSchema = z.object({
  email: BaseValidationSchema.email.optional(),
  phone: BaseValidationSchema.phone.optional(),
  firstName: BaseValidationSchema.name.optional(),
  lastName: BaseValidationSchema.name.optional(),
  avatar: z.any().optional(),
  deleteAvatar: z.boolean().optional(),

  name: z.string().optional(),
  salonName: z.string().optional(),
  address: z.string().optional(),
  inn: z.preprocess(
    (val) => {
      if (typeof val === 'string') {

        return val.replace(/\D/g, '');
      }
      return val;
    },
    z.string().regex(/^\d{10}$|^\d{12}$/, 'ИНН должен содержать только цифры и быть длиной 10 или 12 символов').optional()
  ),
  description: z.string().optional(),

  specialization: z.string().optional(),
  experience: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      return val;
    },
    z.number().min(0).max(50).optional()
  ),
}).refine(data =>
  data.email !== undefined ||
  data.phone !== undefined ||
  data.firstName !== undefined ||
  data.lastName !== undefined ||
  data.avatar !== undefined ||
  data.deleteAvatar !== undefined ||
  data.name !== undefined ||
  data.salonName !== undefined ||
  data.address !== undefined ||
  data.inn !== undefined ||
  data.description !== undefined ||
  data.specialization !== undefined ||
  data.experience !== undefined, {
  message: 'Должно быть указано хотя бы одно поле для обновления',
}).passthrough();


const changePasswordValidationSchema = z.object({
  currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
  newPassword: BaseValidationSchema.password,
  confirmNewPassword: z.string().min(1, 'Подтверждение нового пароля обязательно'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Новый пароль и подтверждение не совпадают',
  path: ['confirmNewPassword'],
});

module.exports = {
  registerValidationSchema,
  loginValidationSchema,
  updateProfileValidationSchema,
  changePasswordValidationSchema,
};