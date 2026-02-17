const { z } = require('zod');


const BaseValidationSchema = {

  email: z.string().email('Пожалуйста, введите действительный адрес электронной почты'),


  password: z.string()
    .min(6, 'Пароль должен содержать не менее 6 символов')
    .max(128, 'Пароль должен содержать не более 128 символов')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Пароль должен содержать хотя бы одну заглавную букву, строчную букву и цифру'),


  phone: z.union([
    z.string().regex(/^\+?[1-9][\d]{9,15}$/, 'Неверный формат номера телефона'),
    z.string().regex(/^\+?(\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{2,4}[-.\s]?\d{2,4}$/, 'Неверный формат номера телефона')
  ]).transform((val) => val.replace(/\D/g, '')),


  name: z.string()
    .min(2, 'Имя должно содержать не менее 2 символов')
    .max(100, 'Имя должно содержать не более 100 символов')
    .regex(/^[A-Za-zА-Яа-яЁё\s\-']+$/i, 'Имя должно содержать только буквы, пробелы, дефисы и апострофы'),


  url: z.string().url('Изображение должно быть действительным URL').optional(),


  role: z.enum(['client', 'master', 'salon', 'admin'], {
    errorMap: () => ({ message: 'Роль должна быть одной из: client, master, salon, admin' })
  }),


  date: z.string().datetime().optional(),


  number: z.number().int().positive().optional(),
};

module.exports = { BaseValidationSchema };