const { z } = require('zod');

/**
 * Middleware для валидации запроса
 * @param {z.ZodSchema} schema - Zod схема для валидации
 * @param {'body' | 'query' | 'params'} target - Что валидировать
 */
const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    try {
      schema.parse(req[target]);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Ошибка валидации данных',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
      }
      next(error);
    }
  };
};

module.exports = { validate };
