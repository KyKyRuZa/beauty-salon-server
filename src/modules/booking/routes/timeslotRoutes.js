const express = require('express');
const router = express.Router();
const timeslotController = require('../controllers/timeslotController');
const { authenticateToken } = require('../../../middleware/auth');


router.use(authenticateToken);

router.get('/master', timeslotController.getMasterSlots);

router.post('/', timeslotController.createTimeSlot);

router.post('/schedule', timeslotController.createSchedule);

router.put('/:id', timeslotController.updateTimeSlot);

router.delete('/:id', timeslotController.deleteTimeSlot);

module.exports = router;
