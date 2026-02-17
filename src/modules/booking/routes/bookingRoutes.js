const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../../../middleware/auth');

router.get('/available-slots', bookingController.getAvailableSlots);

router.get('/free-windows', bookingController.getFreeWindows);


router.use(authenticateToken);

router.post('/', bookingController.createBooking);

router.get('/my', bookingController.getMyBookings);

router.get('/master', bookingController.getMasterBookings);

router.get('/:id', bookingController.getBookingById);

router.put('/:id', bookingController.updateBooking);

router.post('/:id/cancel', bookingController.cancelBooking);

router.post('/:id/confirm', bookingController.confirmBooking);

module.exports = router;
