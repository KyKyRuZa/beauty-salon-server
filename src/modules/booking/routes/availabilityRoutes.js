const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { authenticateToken } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validation');
const {
  setAvailabilitySchema,
  updateAvailabilitySchema,
} = require('../../../validation');

router.get('/available-dates', availabilityController.getAvailableDates);

router.use(authenticateToken);

router.post('/', validate(setAvailabilitySchema, 'body'), availabilityController.setAvailability);

router.get('/', availabilityController.getAvailability);

router.get('/:date', availabilityController.getAvailabilityWithSlots);

router.put('/:id', validate(updateAvailabilitySchema, 'body'), availabilityController.updateAvailability);

router.delete('/:id', availabilityController.deleteAvailability);

router.post('/:id/regenerate', availabilityController.regenerateSlots);

module.exports = router;
