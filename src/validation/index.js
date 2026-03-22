const { BaseValidationSchema } = require('./base');
const {
  registerValidationSchema,
  loginValidationSchema,
  updateProfileValidationSchema,
  changePasswordValidationSchema,
} = require('./auth');
const { adminRegisterValidationSchema, adminLoginValidationSchema } = require('./adminAuth');
const { clientValidationSchema, masterValidationSchema, salonValidationSchema } = require('./user');
const {
  serviceCategoryValidationSchema,
  serviceSubcategoryValidationSchema,
  serviceTemplateValidationSchema,
  masterServiceValidationSchema,
  updateMasterServiceValidationSchema,
  createCategorySchema,
  updateCategorySchema,
  createServiceSchema,
  updateServiceSchema,
  getCategoriesQuerySchema,
} = require('./catalog');
const {
  timeSlotValidationSchema,
  bookingValidationSchema,
  orderValidationSchema,
  masterAvailabilityValidationSchema,
  createBookingSchema,
  updateBookingSchema,
  getBookingsQuerySchema,
  setAvailabilitySchema,
  updateAvailabilitySchema,
  createTimeSlotSchema,
  updateTimeSlotSchema,
} = require('./booking');
const { adminValidationSchema } = require('./admin');

module.exports = {
  BaseValidationSchema,

  registerValidationSchema,
  loginValidationSchema,
  updateProfileValidationSchema,
  changePasswordValidationSchema,

  adminRegisterValidationSchema,
  adminLoginValidationSchema,

  clientValidationSchema,
  masterValidationSchema,
  salonValidationSchema,

  serviceCategoryValidationSchema,
  serviceSubcategoryValidationSchema,
  serviceTemplateValidationSchema,
  masterServiceValidationSchema,
  updateMasterServiceValidationSchema,
  createCategorySchema,
  updateCategorySchema,
  createServiceSchema,
  updateServiceSchema,
  getCategoriesQuerySchema,

  timeSlotValidationSchema,
  bookingValidationSchema,
  orderValidationSchema,
  masterAvailabilityValidationSchema,
  createBookingSchema,
  updateBookingSchema,
  getBookingsQuerySchema,
  setAvailabilitySchema,
  updateAvailabilitySchema,
  createTimeSlotSchema,
  updateTimeSlotSchema,

  adminValidationSchema,
};
