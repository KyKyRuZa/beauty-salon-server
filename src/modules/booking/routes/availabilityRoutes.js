const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { authenticateToken } = require('../../../middleware/auth');

// Публичные маршруты (для клиентов)
router.get('/available-dates', availabilityController.getAvailableDates);

// Маршруты с аутентификацией
router.use(authenticateToken);

router.post('/', availabilityController.setAvailability);

router.get('/', availabilityController.getAvailability);

router.get('/:date', availabilityController.getAvailabilityWithSlots);

router.put('/:id', availabilityController.updateAvailability);

router.delete('/:id', availabilityController.deleteAvailability);

router.post('/:id/regenerate', availabilityController.regenerateSlots);

module.exports = router;
