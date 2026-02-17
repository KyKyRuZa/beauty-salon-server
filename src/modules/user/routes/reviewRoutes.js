const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../../../middleware/auth');

/**
 * @route POST /api/reviews
 * @description Создать отзыв
 * @access Private (требуется аутентификация)
 */
router.post('/', authenticateToken, reviewController.createReview);

/**
 * @route GET /api/reviews/master/:masterId
 * @description Получить отзывы мастера
 * @access Public
 */
router.get('/master/:masterId', reviewController.getMasterReviews);

/**
 * @route GET /api/reviews/salon/:salonId
 * @description Получить отзывы салона
 * @access Public
 */
router.get('/salon/:salonId', reviewController.getSalonReviews);

/**
 * @route GET /api/reviews/stats/master/:masterId
 * @description Получить статистику отзывов мастера
 * @access Public
 */
router.get('/stats/master/:masterId', reviewController.getReviewStats);

/**
 * @route GET /api/reviews/stats/salon/:salonId
 * @description Получить статистику отзывов салона
 * @access Public
 */
router.get('/stats/salon/:salonId', reviewController.getReviewStats);

/**
 * @route GET /api/reviews/:id
 * @description Получить отзыв по ID
 * @access Public
 */
router.get('/:id', reviewController.getReviewById);

/**
 * @route PUT /api/reviews/:id
 * @description Обновить отзыв (только автор или админ)
 * @access Private
 */
router.put('/:id', authenticateToken, reviewController.updateReview);

/**
 * @route DELETE /api/reviews/:id
 * @description Удалить отзыв (только автор или админ)
 * @access Private
 */
router.delete('/:id', authenticateToken, reviewController.deleteReview);

module.exports = router;
