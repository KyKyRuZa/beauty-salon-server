const Favorite = require('../models/Favorite');
const Master = require('../../user/models/Master');
const User = require('../../user/models/User');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('favorite-service');

/**
 * Добавить мастера в избранное
 */
const addToFavorites = async (userId, masterId) => {
  try {
    // Проверка: мастер существует
    const master = await Master.findByPk(masterId);
    if (!master) {
      logger.warn('Мастер не найден', { masterId });
      throw new Error('Мастер не найден');
    }

    // Проверяем наличие записи (включая удалённые)
    const existing = await Favorite.findOne({
      where: { user_id: userId, master_id: masterId },
      paranoid: false // Ищем включая удалённые
    });

    if (existing) {
      // Если запись была удалена - восстанавливаем
      if (existing.deletedAt) {
        await existing.restore();
        logger.info('Мастер восстановлен в избранном', { userId, masterId, favoriteId: existing.id });
        return existing;
      }
      
      logger.warn('Мастер уже в избранном', { userId, masterId });
      throw new Error('Мастер уже в избранном');
    }

    const favorite = await Favorite.create({
      user_id: userId,
      master_id: masterId
    });

    logger.info('Мастер добавлен в избранное', { userId, masterId, favoriteId: favorite.id });

    return favorite;
  } catch (error) {
    logger.error('Ошибка добавления в избранное', { error: error.message, userId, masterId });
    throw error;
  }
};

/**
 * Удалить мастера из избранного
 */
const removeFromFavorites = async (userId, masterId) => {
  try {
    const favorite = await Favorite.findOne({
      where: { user_id: userId, master_id: masterId }
    });

    if (!favorite) {
      logger.warn('Мастер не найден в избранном', { userId, masterId });
      throw new Error('Мастер не в избранном');
    }

    await favorite.destroy();

    logger.info('Мастер удалён из избранного', { userId, masterId });

    return true;
  } catch (error) {
    logger.error('Ошибка удаления из избранного', { error: error.message, userId, masterId });
    throw error;
  }
};

/**
 * Получить список избранных мастеров пользователя
 */
const getUserFavorites = async (userId) => {
  try {
    const favorites = await Favorite.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Master,
          as: 'favorite_master',
          include: [
            {
              model: require('../../user/models/Salon'),
              as: 'salon',
              attributes: ['id', 'name', 'address', 'rating']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    logger.info('Избранные мастера получены', { userId, count: favorites.length });

    return favorites.map(fav => fav.favorite_master);
  } catch (error) {
    logger.error('Ошибка получения избранных мастеров', { error: error.message, userId });
    throw error;
  }
};

/**
 * Проверить, находится ли мастер в избранном
 */
const isFavorite = async (userId, masterId) => {
  try {
    const favorite = await Favorite.findOne({
      where: { user_id: userId, master_id: masterId }
    });

    return !!favorite;
  } catch (error) {
    logger.error('Ошибка проверки избранного', { error: error.message, userId, masterId });
    throw error;
  }
};

/**
 * Переключить статус избранного (добавить/удалить)
 */
const toggleFavorite = async (userId, masterId) => {
  try {
    const existing = await Favorite.findOne({
      where: { user_id: userId, master_id: masterId }
    });

    if (existing) {
      await removeFromFavorites(userId, masterId);
      return { added: false };
    } else {
      await addToFavorites(userId, masterId);
      return { added: true };
    }
  } catch (error) {
    logger.error('Ошибка переключения избранного', { error: error.message, userId, masterId });
    throw error;
  }
};

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  isFavorite,
  toggleFavorite
};
