const { BaseValidationSchema } = require('./base');
const {
  registerValidationSchema,
  loginValidationSchema,
  updateProfileValidationSchema,
} = require('./auth');
const {
  adminRegisterValidationSchema,
  adminLoginValidationSchema,
} = require('./adminAuth');
const {
  clientValidationSchema,
  masterValidationSchema,
  salonValidationSchema,
} = require('./user');
const {
  serviceCategoryValidationSchema,
  serviceSubcategoryValidationSchema,
  serviceTemplateValidationSchema,
  masterServiceValidationSchema,
  updateMasterServiceValidationSchema,
} = require('./catalog');
const {
  timeSlotValidationSchema,
  bookingValidationSchema,
  orderValidationSchema,
  masterAvailabilityValidationSchema,
} = require('./booking');
const {
  adminValidationSchema,
} = require('./admin');

module.exports = {
  // Базовые валидации
  BaseValidationSchema,

  // Валидации аутентификации
  registerValidationSchema,
  loginValidationSchema,
  updateProfileValidationSchema,

  // Валидации аутентификации администратора
  adminRegisterValidationSchema,
  adminLoginValidationSchema,

  // Валидации пользователей
  clientValidationSchema,
  masterValidationSchema,
  salonValidationSchema,

  // Валидации каталога
  serviceCategoryValidationSchema,
  serviceSubcategoryValidationSchema,
  serviceTemplateValidationSchema,
  masterServiceValidationSchema,
  updateMasterServiceValidationSchema,

  // Валидации бронирования
  timeSlotValidationSchema,
  bookingValidationSchema,
  orderValidationSchema,
  masterAvailabilityValidationSchema,

  // Валидации администратора
  adminValidationSchema,
};