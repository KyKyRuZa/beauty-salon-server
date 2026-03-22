const { z } = require('zod');
const { BaseValidationSchema } = require('./base');

const { number } = BaseValidationSchema;

/**
 * Схемы валидации для каталога
 */

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Название должно содержать минимум 2 символа').max(255),
    description: z.string().max(1000).optional(),
    is_popular: z.boolean().optional(),
  }),
});

const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID должен быть числом'),
  }),
  body: z.object({
    name: z.string().min(2).max(255).optional(),
    description: z.string().max(1000).optional(),
    is_popular: z.boolean().optional(),
    is_active: z.boolean().optional(),
  }),
});

const getCategoriesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).default('1'),
    limit: z.string().regex(/^\d+$/).default('20'),
    search: z.string().min(2).optional(),
    category: z.string().optional(),
    sort_by: z.enum(['name', 'created_at', 'updated_at']).default('name'),
    order: z.enum(['ASC', 'DESC']).default('ASC'),
  }),
});

const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Название должно содержать минимум 2 символа').max(255),
    description: z.string().max(1000).optional(),
    price: number.optional(),
    duration: number.optional(),
    category_id: number.optional(),
    is_active: z.boolean().optional(),
  }),
});

const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID должен быть числом'),
  }),
  body: z.object({
    name: z.string().min(2).max(255).optional(),
    description: z.string().max(1000).optional(),
    price: number.optional(),
    duration: number.optional(),
    category_id: number.optional(),
    is_active: z.boolean().optional(),
  }),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesQuerySchema,
  createServiceSchema,
  updateServiceSchema,
};
