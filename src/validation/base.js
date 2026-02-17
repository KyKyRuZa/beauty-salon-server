const { z } = require('zod');

// Базовая схема для валидации
const BaseValidationSchema = {
  // Валидация email
  email: z.string().email('Пожалуйста, введите действительный адрес электронной почты'),

  // Валидация пароля
  password: z.string()
    .min(6, 'Пароль должен содержать не менее 6 символов')
    .max(128, 'Пароль должен содержать не более 128 символов')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Пароль должен содержать хотя бы одну заглавную букву, строчную букву и цифру'),

  // Валидация телефона
  phone: z.union([
    z.string().regex(/^\+?[1-9][\d]{9,15}$/, 'Неверный формат номера телефона'), // For clean digit-only format
    z.string().regex(/^\+?(\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{2,4}[-.\s]?\d{2,4}$/, 'Неверный формат номера телефона') // For formatted format
  ]).transform((val) => val.replace(/\D/g, '')), // Убираем все лишние символы для сохранения в базе

  // Валидация имени
  name: z.string()
    .min(2, 'Имя должно содержать не менее 2 символов')
    .max(100, 'Имя должно содержать не более 100 символов')
    .regex(/^[A-Za-zА-Яа-яЁё\s\-']+$/i, 'Имя должно содержать только буквы, пробелы, дефисы и апострофы'),

  // Валидация URL
  url: z.string().url('Изображение должно быть действительным URL').optional(),

  // Валидация роли
  role: z.enum(['client', 'master', 'salon', 'admin'], {
    errorMap: () => ({ message: 'Роль должна быть одной из: client, master, salon, admin' })
  }),

  // Валидация даты
  date: z.string().datetime().optional(),

  // Валидация числа
  number: z.number().int().positive().optional(),
};

module.exports = { BaseValidationSchema };