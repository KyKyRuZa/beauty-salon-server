const { createLogger } = require('../utils/logger');

const validationLogger = createLogger('validation-middleware');

/**
 * Преобразует FormData в обычный объект
 * @param {FormData|Object} data - Данные для преобразования
 * @returns {Object} - Обычный объект с данными
 */
const convertFormDataToObject = (data) => {
  if (data && (data.constructor && data.constructor.name === 'FormData' || typeof data.get === 'function')) {
    const obj = {};
    for (const [key, value] of data.entries()) {
      obj[key] = value;
    }
    return obj;
  }
  return data;
};

/**
 * Middleware для валидации входящих данных с использованием Zod
 * @param {z.Schema} schema - Схема валидации Zod
 * @param {'body' | 'params' | 'query'} location - Где искать данные для валидации
 */
const validate = (schema, location = 'body') => {
  return (req, res, next) => {
    try {
      // Преобразуем FormData в обычный объект, если необходимо
      const rawData = req[location];
      const dataToValidate = convertFormDataToObject(rawData);

      // Валидируем данные
      const parsedData = schema.parse(dataToValidate);

      // Заменяем оригинальные данные валидированными
      // Это позволяет Zod выполнить преобразования типов при необходимости
      req[location] = parsedData;

      validationLogger.info(`Данные успешно валидированы`, {
        schema: schema._def.typeName,
        method: req.method,
        url: req.url,
        userId: req.user?.id
      });

      next();
    } catch (error) {
      // Проверяем, является ли ошибка ошибкой Zod
      if (error && error.issues) {
        const errors = error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          value: issue.input
        }));

        validationLogger.warn(`Ошибка валидации`, {
          errors,
          method: req.method,
          url: req.url,
          userId: req.user?.id
        });

        return res.status(400).json({
          success: false,
          message: 'Ошибка валидации данных',
          errors
        });
      }

      validationLogger.error(`Неизвестная ошибка валидации`, {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url
      });

      return res.status(500).json({
        success: false,
        message: 'Ошибка валидации данных'
      });
    }
  };
};

module.exports = { validate };