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

  BaseValidationSchema,


  registerValidationSchema,
  loginValidationSchema,
  updateProfileValidationSchema,


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


  timeSlotValidationSchema,
  bookingValidationSchema,
  orderValidationSchema,
  masterAvailabilityValidationSchema,


  adminValidationSchema,
};