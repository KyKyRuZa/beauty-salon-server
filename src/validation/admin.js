const { z } = require('zod');
const { BaseValidationSchema } = require('./base');


const adminValidationSchema = z.object({
  user_id: BaseValidationSchema.number,
  role: z.enum(['admin', 'super_admin', 'moderator'], {
    errorMap: () => ({ message: 'Role must be admin, super_admin, or moderator' })
  }).default('admin'),
  permissions: z.record(z.boolean()).optional(),
  first_name: BaseValidationSchema.name.optional(),
  last_name: BaseValidationSchema.name.optional(),
  is_active: z.boolean().default(true),
});

module.exports = {
  adminValidationSchema,
};