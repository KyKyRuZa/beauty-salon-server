const express = require('express');
const router = express.Router();
const timeslotController = require('../controllers/timeslotController');
const { authenticateToken } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validation');
const {
  createTimeSlotSchema,
  updateTimeSlotSchema,
} = require('../../../validation');

// Публичные маршруты
router.get('/master', timeslotController.getMasterSlots);

// Маршруты, требующие авторизации
router.use(authenticateToken);

router.post('/', validate(createTimeSlotSchema, 'body'), timeslotController.createTimeSlot);

router.post('/schedule', timeslotController.createSchedule);

router.put('/:id', validate(updateTimeSlotSchema, 'body'), timeslotController.updateTimeSlot);

router.delete('/:id', timeslotController.deleteTimeSlot);

module.exports = router;
