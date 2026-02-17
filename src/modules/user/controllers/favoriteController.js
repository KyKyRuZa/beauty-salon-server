const favoriteService = require('../services/favoriteService');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('favorite-controller');

/**
 * Получить список избранных мастеров
 * GET /api/favorites
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Требуется аутентификация'
      });
    }

    logger.info('Запрос избранных мастеров', { userId });

    const favorites = await favoriteService.getUserFavorites(userId);

    res.json({
      success: true,
      data: favorites
    });
  } catch (error) {
    logger.error('Ошибка получения избранных мастеров', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Добавить мастера в избранное
 * POST /api/favorites/:masterId
 */
const addFavorite = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { masterId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Требуется аутентификация'
      });
    }

    logger.info('Добавление мастера в избранное', { userId, masterId });

    const favorite = await favoriteService.addToFavorites(userId, masterId);

    res.status(201).json({
      success: true,
      message: 'Мастер добавлен в избранное',
      data: favorite
    });
  } catch (error) {
    logger.error('Ошибка добавления в избранное', { error: error.message });

    if (error.message.includes('уже в избранном')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Удалить мастера из избранного
 * DELETE /api/favorites/:masterId
 */
const removeFavorite = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { masterId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Требуется аутентификация'
      });
    }

    logger.info('Удаление мастера из избранного', { userId, masterId });

    await favoriteService.removeFromFavorites(userId, masterId);

    res.json({
      success: true,
      message: 'Мастер удалён из избранного'
    });
  } catch (error) {
    logger.error('Ошибка удаления из избранного', { error: error.message });

    if (error.message.includes('не в избранном')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Переключить статус избранного
 * POST /api/favorites/:masterId/toggle
 */
const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { masterId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Требуется аутентификация'
      });
    }

    logger.info('Переключение статуса избранного', { userId, masterId });

    const result = await favoriteService.toggleFavorite(userId, masterId);

    res.json({
      success: true,
      message: result.added ? 'Мастер добавлен в избранное' : 'Мастер удалён из избранного',
      data: result
    });
  } catch (error) {
    logger.error('Ошибка переключения статуса избранного', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Проверить, находится ли мастер в избранном
 * GET /api/favorites/:masterId/check
 */
const checkFavorite = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { masterId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Требуется аутентификация'
      });
    }

    const isFav = await favoriteService.isFavorite(userId, masterId);

    res.json({
      success: true,
      data: { isFavorite: isFav }
    });
  } catch (error) {
    logger.error('Ошибка проверки избранного', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  checkFavorite
};
