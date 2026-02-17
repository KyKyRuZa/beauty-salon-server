const { z } = require('zod');
const { BaseValidationSchema } = require('./base');

// Схема валидации для категории услуги
const serviceCategoryValidationSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  is_active: z.boolean().optional(),
  is_popular: z.boolean().optional(),
});

// Схема валидации для подкатегории услуги
const serviceSubcategoryValidationSchema = z.object({
  category_id: BaseValidationSchema.number,
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  is_active: z.boolean().optional(),
});

// Схема валидации для связи мастер-услуга (новая версия без шаблонов)
const masterServiceValidationSchema = z.object({
  master_id: BaseValidationSchema.number, // обязательное поле при создании
  salon_id: BaseValidationSchema.number.optional(),
  category_id: BaseValidationSchema.number.optional(),
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  price: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).refine(val => val >= 0, {
    message: "Price must be greater than or equal to 0"
  }),
  is_active: z.boolean().optional(),
});

// Схема валидации для обновления услуги мастера
const updateMasterServiceValidationSchema = z.object({
  master_id: BaseValidationSchema.number.optional(), // опциональное поле при обновлении
  salon_id: BaseValidationSchema.number.optional(),
  category_id: BaseValidationSchema.number.optional(),
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(1000).optional(),
  price: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).refine(val => val >= 0, {
    message: "Price must be greater than or equal to 0"
  }).optional(),
  is_active: z.boolean().optional(),
});

module.exports = {
  serviceCategoryValidationSchema,
  serviceSubcategoryValidationSchema,
  masterServiceValidationSchema,
  updateMasterServiceValidationSchema,
};