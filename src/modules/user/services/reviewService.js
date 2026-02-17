const Review = require('../models/Review');
const Master = require('../../user/models/Master');
const Salon = require('../../user/models/Salon');
const Booking = require('../../booking/models/Booking');
const { sequelize } = require('../../../config/database');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('review-service');

const createReview = async (reviewData) => {
  const transaction = await sequelize.transaction();

  try {
    const { user_id, master_id, salon_id, booking_id, rating, comment } = reviewData;


    if (!master_id && !salon_id) {
      logger.warn('Попытка создать отзыв без указания мастера или салона', { user_id });
      throw new Error('Отзыв должен быть оставлен мастеру или салону');
    }


    if (booking_id) {
      const booking = await Booking.findByPk(booking_id);
      if (!booking) {
        logger.warn('Бронирование не найдено', { booking_id });
        throw new Error('Бронирование не найдено');
      }


      if (booking.user_id !== user_id) {
        logger.warn('Пользователь пытается оставить отзыв к чужому бронированию', { user_id, booking_id });
        throw new Error('Вы можете оставить отзыв только к своему бронированию');
      }


      const existingReview = await Review.findOne({ where: { booking_id } });
      if (existingReview) {
        logger.warn('Попытка повторного отзыва к бронированию', { booking_id, user_id });
        throw new Error('Вы уже оставили отзыв к этому бронированию');
      }
    }


    const review = await Review.create({
      user_id,
      master_id,
      salon_id,
      booking_id,
      rating,
      comment,
      is_visible: true
    }, { transaction });


    if (master_id) {
      await updateMasterRating(master_id, transaction);
    }
    if (salon_id) {
      await updateSalonRating(salon_id, transaction);
    }

    await transaction.commit();
    logger.info('Отзыв успешно создан', { reviewId: review.id, userId: user_id });

    return review;
  } catch (error) {
    await transaction.rollback();
    logger.error('Ошибка создания отзыва', { error: error.message, reviewData });
    throw error;
  }
};

const updateMasterRating = async (masterId, transaction = null) => {
  try {
    const options = transaction ? { transaction } : {};


    const reviews = await Review.findAll({
      where: { master_id: masterId, is_visible: true },
      attributes: ['rating'],
      ...options
    });


    let newRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      newRating = Math.round((sum / reviews.length) * 100) / 100;
    }


    await Master.update(
      { rating: newRating },
      { where: { id: masterId }, ...options }
    );

    logger.info('Рейтинг мастера обновлен', { masterId, newRating, reviewsCount: reviews.length });
    return newRating;
  } catch (error) {
    logger.error('Ошибка обновления рейтинга мастера', { masterId, error: error.message });
    throw error;
  }
};

const updateSalonRating = async (salonId, transaction = null) => {
  try {
    const options = transaction ? { transaction } : {};


    const reviews = await Review.findAll({
      where: { salon_id: salonId, is_visible: true },
      attributes: ['rating'],
      ...options
    });


    let newRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      newRating = Math.round((sum / reviews.length) * 100) / 100;
    }


    await Salon.update(
      { rating: newRating },
      { where: { id: salonId }, ...options }
    );

    logger.info('Рейтинг салона обновлен', { salonId, newRating, reviewsCount: reviews.length });
    return newRating;
  } catch (error) {
    logger.error('Ошибка обновления рейтинга салона', { salonId, error: error.message });
    throw error;
  }
};

const getMasterReviews = async (masterId, options = {}) => {
  const { limit = 20, offset = 0, is_visible = true } = options;

  try {
    const { count, rows } = await Review.findAndCountAll({
      where: { master_id: masterId, is_visible },
      include: [
        {
          model: require('../../user/models/User'),
          as: 'user',
          attributes: ['id', 'email', 'phone']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    logger.info('Отзывы мастера получены', { masterId, count });
    return { count, rows };
  } catch (error) {
    logger.error('Ошибка получения отзывов мастера', { masterId, error: error.message });
    throw error;
  }
};

const getSalonReviews = async (salonId, options = {}) => {
  const { limit = 20, offset = 0, is_visible = true } = options;

  try {
    const { count, rows } = await Review.findAndCountAll({
      where: { salon_id: salonId, is_visible },
      include: [
        {
          model: require('../../user/models/User'),
          as: 'user',
          attributes: ['id', 'email', 'phone']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    logger.info('Отзывы салона получены', { salonId, count });
    return { count, rows };
  } catch (error) {
    logger.error('Ошибка получения отзывов салона', { salonId, error: error.message });
    throw error;
  }
};

const getReviewById = async (id) => {
  try {
    const review = await Review.findByPk(id, {
      include: [
        { model: require('../../user/models/User'), as: 'user', attributes: ['id', 'email', 'phone'] },
        { model: require('../../user/models/Master'), as: 'master' },
        { model: require('../../user/models/Salon'), as: 'salon' },
        { model: require('../../booking/models/Booking'), as: 'booking' }
      ]
    });

    if (!review) {
      logger.warn('Отзыв не найден', { id });
      return null;
    }

    logger.info('Отзыв получен', { id });
    return review;
  } catch (error) {
    logger.error('Ошибка получения отзыва', { id, error: error.message });
    throw error;
  }
};

const updateReview = async (id, updateData) => {
  const transaction = await sequelize.transaction();

  try {
    const review = await Review.findByPk(id);
    if (!review) {
      logger.warn('Отзыв не найден для обновления', { id });
      throw new Error('Отзыв не найден');
    }

    await review.update(updateData, { transaction });


    if (updateData.rating !== undefined || updateData.is_visible !== undefined) {
      if (review.master_id) {
        await updateMasterRating(review.master_id, transaction);
      }
      if (review.salon_id) {
        await updateSalonRating(review.salon_id, transaction);
      }
    }

    await transaction.commit();
    logger.info('Отзыв обновлен', { id });

    return review;
  } catch (error) {
    await transaction.rollback();
    logger.error('Ошибка обновления отзыва', { id, error: error.message });
    throw error;
  }
};

const deleteReview = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const review = await Review.findByPk(id);
    if (!review) {
      logger.warn('Отзыв не найден для удаления', { id });
      throw new Error('Отзыв не найден');
    }

    const masterId = review.master_id;
    const salonId = review.salon_id;

    await review.destroy({ transaction });


    if (masterId) {
      await updateMasterRating(masterId, transaction);
    }
    if (salonId) {
      await updateSalonRating(salonId, transaction);
    }

    await transaction.commit();
    logger.info('Отзыв удален', { id });

    return true;
  } catch (error) {
    await transaction.rollback();
    logger.error('Ошибка удаления отзыва', { id, error: error.message });
    throw error;
  }
};

const getReviewStats = async (masterId, salonId) => {
  try {
    const where = { is_visible: true };
    if (masterId) where.master_id = masterId;
    if (salonId) where.salon_id = salonId;

    const reviews = await Review.findAll({
      where,
      attributes: ['rating']
    });

    const total = reviews.length;
    if (total === 0) {
      return {
        total: 0,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = Math.round((sum / total) * 100) / 100;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      distribution[r.rating]++;
    });

    return { total, average, distribution };
  } catch (error) {
    logger.error('Ошибка получения статистики отзывов', { error: error.message });
    throw error;
  }
};

module.exports = {
  createReview,
  updateMasterRating,
  updateSalonRating,
  getMasterReviews,
  getSalonReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewStats
};
