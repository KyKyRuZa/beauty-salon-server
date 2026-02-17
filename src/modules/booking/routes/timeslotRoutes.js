const express = require('express');
const router = express.Router();
const timeslotController = require('../controllers/timeslotController');
const { authenticateToken } = require('../../../middleware/auth');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

/**
 * @route GET /api/timeslots/master
 * @description Получить слоты мастера на дату
 * @access Private (мастер)
 */
router.get('/master', timeslotController.getMasterSlots);

/**
 * @route POST /api/timeslots
 * @description Создать временной слот
 * @access Private (мастер)
 */
router.post('/', timeslotController.createTimeSlot);

/**
 * @route POST /api/timeslots/schedule
 * @description Пакетное создание слотов по расписанию
 * @access Private (мастер)
 */
router.post('/schedule', timeslotController.createSchedule);

/**
 * @route PUT /api/timeslots/:id
 * @description Обновить временной слот
 * @access Private (мастер)
 */
router.put('/:id', timeslotController.updateTimeSlot);

/**
 * @route DELETE /api/timeslots/:id
 * @description Удалить временной слот
 * @access Private (мастер)
 */
router.delete('/:id', timeslotController.deleteTimeSlot);

module.exports = router;
