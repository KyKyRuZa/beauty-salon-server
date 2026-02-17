const { z } = require('zod');
const { BaseValidationSchema } = require('./base');


const serviceCategoryValidationSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  is_active: z.boolean().optional(),
  is_popular: z.boolean().optional(),
});


const serviceSubcategoryValidationSchema = z.object({
  category_id: BaseValidationSchema.number,
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  is_active: z.boolean().optional(),
});


const masterServiceValidationSchema = z.object({
  master_id: BaseValidationSchema.number,
  salon_id: BaseValidationSchema.number.optional(),
  category_id: BaseValidationSchema.number.optional(),
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  price: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).refine(val => val >= 0, {
    message: "Price must be greater than or equal to 0"
  }),
  is_active: z.boolean().optional(),
});


const updateMasterServiceValidationSchema = z.object({
  master_id: BaseValidationSchema.number.optional(),
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