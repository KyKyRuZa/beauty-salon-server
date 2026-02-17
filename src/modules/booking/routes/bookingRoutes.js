const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../../../middleware/auth');

/**
 * @route GET /api/booking/available-slots
 * @description Получить доступные слоты
 * @access Public
 */
router.get('/available-slots', bookingController.getAvailableSlots);

/**
 * @route GET /api/booking/free-windows
 * @description Получить свободные окна для записи
 * @access Public
 */
router.get('/free-windows', bookingController.getFreeWindows);

// Все остальные маршруты требуют аутентификации
router.use(authenticateToken);

/**
 * @route POST /api/booking
 * @description Создать новую запись
 * @access Private (клиент)
 */
router.post('/', bookingController.createBooking);

/**
 * @route GET /api/booking/my
 * @description Получить мои записи (для клиента)
 * @access Private (клиент)
 */
router.get('/my', bookingController.getMyBookings);

/**
 * @route GET /api/booking/master
 * @description Получить записи мастера
 * @access Private (мастер)
 */
router.get('/master', bookingController.getMasterBookings);

/**
 * @route GET /api/booking/:id
 * @description Получить бронирование по ID
 * @access Private
 */
router.get('/:id', bookingController.getBookingById);

/**
 * @route PUT /api/booking/:id
 * @description Обновить бронирование
 * @access Private
 */
router.put('/:id', bookingController.updateBooking);

/**
 * @route POST /api/booking/:id/cancel
 * @description Отменить бронирование
 * @access Private
 */
router.post('/:id/cancel', bookingController.cancelBooking);

/**
 * @route POST /api/booking/:id/confirm
 * @description Подтвердить бронирование (для мастера)
 * @access Private (мастер)
 */
router.post('/:id/confirm', bookingController.confirmBooking);

module.exports = router;
