const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validation');
const {
  createBookingSchema,
  updateBookingSchema,
  getBookingsQuerySchema,
} = require('../../../validation/booking');

router.get('/available-slots', bookingController.getAvailableSlots);

router.get('/free-windows', bookingController.getFreeWindows);

router.use(authenticateToken);

router.post('/', validate(createBookingSchema, 'body'), bookingController.createBooking);

router.get('/my', validate(getBookingsQuerySchema, 'query'), bookingController.getMyBookings);

router.get('/master', validate(getBookingsQuerySchema, 'query'), bookingController.getMasterBookings);

router.get('/:id', bookingController.getBookingById);

router.put('/:id', validate(updateBookingSchema, 'body'), bookingController.updateBooking);

router.post('/:id/cancel', bookingController.cancelBooking);

router.post('/:id/confirm', bookingController.confirmBooking);

module.exports = router;
