const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { authenticateToken } = require('../../../middleware/auth');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

/**
 * @route POST /api/availability
 * @description Создать или обновить расписание мастера на дату
 * @access Private (мастер)
 */
router.post('/', availabilityController.setAvailability);

/**
 * @route GET /api/availability
 * @description Получить расписание мастера
 * @access Private (мастер)
 */
router.get('/', availabilityController.getAvailability);

/**
 * @route GET /api/availability/:date
 * @description Получить расписание с слотами на дату
 * @access Private (мастер)
 */
router.get('/:date', availabilityController.getAvailabilityWithSlots);

/**
 * @route PUT /api/availability/:id
 * @description Обновить расписание
 * @access Private (мастер)
 */
router.put('/:id', availabilityController.updateAvailability);

/**
 * @route DELETE /api/availability/:id
 * @description Удалить расписание
 * @access Private (мастер)
 */
router.delete('/:id', availabilityController.deleteAvailability);

/**
 * @route POST /api/availability/:id/regenerate
 * @description Перегенерировать слоты для даты
 * @access Private (мастер)
 */
router.post('/:id/regenerate', availabilityController.regenerateSlots);

module.exports = router;
