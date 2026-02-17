const reviewService = require('../services/reviewService');
const { createLogger } = require('../../../utils/logger');
const { reviewValidationSchema } = require('../../../validation/user');

const logger = createLogger('review-controller');

/**
 * Создать отзыв
 * POST /api/reviews
 */
const createReview = async (req, res) => {
  try {
    logger.info('Попытка создания отзыва', { userId: req.user?.id, body: req.body });

    const user_id = req.user?.id;

    if (!user_id) {
      logger.warn('Попытка создать отзыв без аутентификации');
      return res.status(401).json({
        success: false,
        message: 'Требуется аутентификация'
      });
    }

    // Валидация данных
    const validationResult = reviewValidationSchema.safeParse(req.body);
    if (!validationResult.success) {
      logger.warn('Ошибка валидации отзыва', { errors: validationResult.error.errors });
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }

    const { master_id, salon_id, booking_id, rating, comment } = validationResult.data;

    const review = await reviewService.createReview({
      user_id,
      master_id,
      salon_id,
      booking_id,
      rating: parseInt(rating),
      comment
    });

    logger.info('Отзыв успешно создан', { reviewId: review.id, userId: user_id });

    res.status(201).json({
      success: true,
      message: 'Отзыв успешно создан',
      data: review
    });
  } catch (error) {
    logger.error('Ошибка создания отзыва', { error: error.message });

    if (error.message.includes('уже оставили отзыв')) {
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
 * Получить отзывы мастера
 * GET /api/reviews/master/:masterId
 */
const getMasterReviews = async (req, res) => {
  try {
    const { masterId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    logger.info('Запрос отзывов мастера', { masterId, limit, offset });

    const result = await reviewService.getMasterReviews(masterId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result.rows,
      total: result.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Ошибка получения отзывов мастера', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Получить отзывы салона
 * GET /api/reviews/salon/:salonId
 */
const getSalonReviews = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    logger.info('Запрос отзывов салона', { salonId, limit, offset });

    const result = await reviewService.getSalonReviews(salonId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result.rows,
      total: result.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Ошибка получения отзывов салона', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Получить отзыв по ID
 * GET /api/reviews/:id
 */
const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('Запрос отзыва по ID', { id });

    const review = await reviewService.getReviewById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Отзыв не найден'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    logger.error('Ошибка получения отзыва', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Обновить отзыв
 * PUT /api/reviews/:id
 */
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, is_visible } = req.body;

    logger.info('Попытка обновления отзыва', { id, userId: req.user?.id });

    // Проверка прав доступа (только автор или админ)
    const existingReview = await reviewService.getReviewById(id);
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Отзыв не найден'
      });
    }

    // Проверка: только автор может редактировать свой отзыв
    if (existingReview.user_id !== req.user?.id && req.user?.role !== 'admin') {
      logger.warn('Попытка редактирования чужого отзыва', { id, userId: req.user?.id });
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен'
      });
    }

    const updateData = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Рейтинг должен быть от 1 до 5'
        });
      }
      updateData.rating = parseInt(rating);
    }
    if (comment !== undefined) updateData.comment = comment;
    if (req.user?.role === 'admin' && is_visible !== undefined) {
      updateData.is_visible = is_visible;
    }

    const review = await reviewService.updateReview(id, updateData);

    logger.info('Отзыв обновлен', { id });

    res.json({
      success: true,
      message: 'Отзыв обновлен',
      data: review
    });
  } catch (error) {
    logger.error('Ошибка обновления отзыва', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Удалить отзыв
 * DELETE /api/reviews/:id
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('Попытка удаления отзыва', { id, userId: req.user?.id });

    // Проверка прав доступа (только автор или админ)
    const existingReview = await reviewService.getReviewById(id);
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Отзыв не найден'
      });
    }

    if (existingReview.user_id !== req.user?.id && req.user?.role !== 'admin') {
      logger.warn('Попытка удаления чужого отзыва', { id, userId: req.user?.id });
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен'
      });
    }

    await reviewService.deleteReview(id);

    logger.info('Отзыв удален', { id });

    res.json({
      success: true,
      message: 'Отзыв удален'
    });
  } catch (error) {
    logger.error('Ошибка удаления отзыва', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Получить статистику отзывов
 * GET /api/reviews/stats/master/:masterId
 * GET /api/reviews/stats/salon/:salonId
 */
const getReviewStats = async (req, res) => {
  try {
    const { masterId, salonId } = req.params;

    logger.info('Запрос статистики отзывов', { masterId, salonId });

    const stats = await reviewService.getReviewStats(masterId, salonId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Ошибка получения статистики отзывов', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createReview,
  getMasterReviews,
  getSalonReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewStats
};
