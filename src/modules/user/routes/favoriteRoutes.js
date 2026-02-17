const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../../../middleware/auth');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

/**
 * @route GET /api/favorites
 * @description Получить список избранных мастеров
 * @access Private
 */
router.get('/', favoriteController.getFavorites);

/**
 * @route POST /api/favorites/:masterId
 * @description Добавить мастера в избранное
 * @access Private
 */
router.post('/:masterId', favoriteController.addFavorite);

/**
 * @route DELETE /api/favorites/:masterId
 * @description Удалить мастера из избранного
 * @access Private
 */
router.delete('/:masterId', favoriteController.removeFavorite);

/**
 * @route POST /api/favorites/:masterId/toggle
 * @description Переключить статус избранного
 * @access Private
 */
router.post('/:masterId/toggle', favoriteController.toggleFavorite);

/**
 * @route GET /api/favorites/:masterId/check
 * @description Проверить, находится ли мастер в избранном
 * @access Private
 */
router.get('/:masterId/check', favoriteController.checkFavorite);

module.exports = router;
