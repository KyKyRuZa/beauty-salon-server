const { z } = require('zod');
const { BaseValidationSchema } = require('./base');

// Схема валидации для создания/обновления клиента
const clientValidationSchema = z.object({
  user_id: BaseValidationSchema.number,
  first_name: BaseValidationSchema.name,
  last_name: BaseValidationSchema.name,
  image_url: BaseValidationSchema.url,
});

// Схема валидации для создания/обновления мастера
const masterValidationSchema = z.object({
  user_id: BaseValidationSchema.number,
  first_name: BaseValidationSchema.name.optional(),
  last_name: BaseValidationSchema.name.optional(),
  specialization: z.string().min(2).max(255).optional(),
  experience: z.number().min(0).max(50).optional(),
  rating: z.number().min(0).max(5).optional(),
  salon_id: BaseValidationSchema.number.optional(),
  bio: z.string().max(1000).optional(),
  is_available: z.boolean().optional(),
  image_url: BaseValidationSchema.url,
});

// Схема валидации для создания/обновления салона
const salonValidationSchema = z.object({
  user_id: BaseValidationSchema.number,
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  address: z.string().max(500).optional(),
  inn: z.string().regex(/^\d{10}$|^\d{12}$/, 'ИНН должен содержать только цифры и быть длиной 10 или 12 символов').optional(),
  rating: z.number().min(0).max(5).optional(),
  image_url: BaseValidationSchema.url,
});

// Схема валидации для создания отзыва
const reviewValidationSchema = z.object({
  master_id: BaseValidationSchema.number.optional(),
  salon_id: BaseValidationSchema.number.optional(),
  booking_id: BaseValidationSchema.number.optional(),
  rating: z.number().min(1).max(5, 'Рейтинг должен быть от 1 до 5'),
  comment: z.string().max(1000, 'Комментарий не должен превышать 1000 символов').optional(),
}).refine(data => data.master_id || data.salon_id, {
  message: 'Отзыв должен быть оставлен мастеру или салону',
  path: ['master_id', 'salon_id'],
});

module.exports = {
  clientValidationSchema,
  masterValidationSchema,
  salonValidationSchema,
  reviewValidationSchema,
};