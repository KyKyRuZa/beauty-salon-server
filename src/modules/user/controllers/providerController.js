const Master = require('../models/Master');
const Salon = require('../models/Salon');
const { sequelize } = require('../../../config/database');
const { Op } = require('sequelize');
const { createLogger } = require('../../../utils/logger');
const cacheService = require('../../../utils/cacheService');

const logger = createLogger('provider-controller');

/**
 * Получить топ мастеров по рейтингу и активности
 * @param {number} limit - Количество мастеров (по умолчанию 4)
 * @param {number} minRating - Минимальный рейтинг (по умолчанию 4.5)
 * @returns {Promise<Array>}
 */
const getTopMasters = async (limit = 4, minRating = 4.5) => {
  const cacheKey = cacheService.KEYS.TOP_MASTERS(limit, minRating);

  // Проверяем кэш
  const cached = await cacheService.cache.get(cacheKey);
  if (cached) {
    logger.info('Топ мастеров получен из кэша', { limit, minRating });
    return cached;
  }

  try {
    // Получаем мастеров с рейтингом >= minRating
    let masters = await Master.findAll({
      where: {
        rating: { [Op.gte]: minRating },
        is_available: true,
      },
      attributes: [
        'id',
        'user_id',
        'first_name',
        'last_name',
        'specialization',
        'experience',
        'rating',
        'bio',
        'image_url',
        'salon_id',
        [
          sequelize.literal(`(
          SELECT COUNT(*) FROM "booking_schema"."booking" 
          WHERE "booking"."master_id" = "Master"."id" 
          AND "booking"."status" IN ('confirmed', 'completed')
          AND "booking"."start_time" >= NOW() - INTERVAL '30 days'
        )`),
          'bookings_count',
        ],
        [
          sequelize.literal(`(
          SELECT COUNT(*) FROM "user_schema"."reviews" 
          WHERE "reviews"."master_id" = "Master"."id"
        )`),
          'reviews_count',
        ],
      ],
      include: [
        {
          model: Salon,
          as: 'salon',
          attributes: ['id', 'name', 'address'],
          required: false,
        },
      ],
      order: [
        [sequelize.col('rating'), 'DESC'],
        [sequelize.literal('bookings_count'), 'DESC'],
      ],
      limit,
    });

    // Если мастеров меньше limit, пробуем с minRating = 4.0
    if (masters.length < limit && minRating > 4.0) {
      logger.info('Мастеров меньше чем нужно, понижаем порог рейтинга', {
        current: minRating,
        new: 4.0,
        found: masters.length,
      });

      masters = await Master.findAll({
        where: {
          rating: { [Op.gte]: 4.0 },
          is_available: true,
        },
        attributes: [
          'id',
          'user_id',
          'first_name',
          'last_name',
          'specialization',
          'experience',
          'rating',
          'bio',
          'image_url',
          'salon_id',
          [
            sequelize.literal(`(
            SELECT COUNT(*) FROM "booking_schema"."booking" 
            WHERE "booking"."master_id" = "Master"."id" 
            AND "booking"."status" IN ('confirmed', 'completed')
            AND "booking"."start_time" >= NOW() - INTERVAL '30 days'
          )`),
            'bookings_count',
          ],
          [
            sequelize.literal(`(
            SELECT COUNT(*) FROM "user_schema"."reviews" 
            WHERE "reviews"."master_id" = "Master"."id"
          )`),
            'reviews_count',
          ],
        ],
        include: [
          {
            model: Salon,
            as: 'salon',
            attributes: ['id', 'name', 'address'],
            required: false,
          },
        ],
        order: [
          [sequelize.col('rating'), 'DESC'],
          [sequelize.literal('bookings_count'), 'DESC'],
        ],
        limit,
      });
    }

    // Преобразуем результат
    const result = masters.map((master) => {
      const data = master.toJSON();
      return {
        id: data.id,
        name: `${data.first_name} ${data.last_name}`,
        specialty: data.specialization || 'Универсальный мастер',
        location: data.salon?.address || 'Адрес не указан',
        salon_id: data.salon_id,
        rating: parseFloat(data.rating) || 0,
        reviews_count: parseInt(data.reviews_count) || 0,
        photoUrl: data.image_url || 'https://via.placeholder.com/300',
        role: 'master',
        education: data.experience >= 3, // Есть обучение если опыт >= 3 лет
        workHours: '09:00 – 20:00', // TODO: получить из расписания
      };
    });

    // Кэшируем на 45 минут
    await cacheService.cache.set(cacheKey, result, cacheService.CACHE_TTL.TOP_MASTERS);
    logger.info('Топ мастеров сохранён в кэш', { count: result.length });

    return result;
  } catch (error) {
    logger.error('Ошибка получения топ мастеров', { error: error.message });
    return [];
  }
};

const getTopMastersController = async (req, res) => {
  logger.info('Получение топ мастеров', { ip: req.ip });

  try {
    const limit = parseInt(req.query.limit) || 4;
    const minRating = parseFloat(req.query.minRating) || 4.5;

    const masters = await getTopMasters(limit, minRating);

    if (masters.length === 0) {
      logger.warn('Топ мастеров пуст', { ip: req.ip });
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Пока нет мастеров с высоким рейтингом',
      });
    }

    logger.info('Топ мастеров успешно получен', { count: masters.length, ip: req.ip });

    res.status(200).json({
      success: true,
      data: masters,
    });
  } catch (error) {
    logger.error('Ошибка получения топ мастеров', { error: error.message, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMasterById = async (req, res) => {
  logger.info('Получение данных мастера по ID', { masterId: req.params.id, ip: req.ip });

  try {
    const { id } = req.params;

    const master = await Master.findByPk(id, {
      attributes: [
        'id',
        'user_id',
        'first_name',
        'last_name',
        'specialization',
        'experience',
        'rating',
        'bio',
        'is_available',
        'image_url',
        'salon_id',
        'created_at',
        'updated_at',
      ],
      include: [
        {
          model: require('../models/Salon'),
          as: 'salon',
          attributes: ['id', 'name', 'address'],
        },
      ],
    });

    if (!master) {
      logger.warn('Мастер не найден', { masterId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Мастер не найден',
      });
    }

    logger.info('Данные мастера успешно получены', { masterId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      data: {
        ...master.toJSON(),
        address: master.salon?.address || 'Адрес не указан',
      },
    });
  } catch (error) {
    logger.error('Ошибка получения данных мастера', {
      error: error.message,
      masterId: req.params.id,
      ip: req.ip,
    });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSalonById = async (req, res) => {
  logger.info('Получение данных салона по ID', { salonId: req.params.id, ip: req.ip });

  try {
    const { id } = req.params;
    const SalonLocation = require('../models/SalonLocation');

    const salon = await Salon.findByPk(id, {
      attributes: [
        'id',
        'user_id',
        'name',
        'description',
        'address',
        'inn',
        'rating',
        'image_url',
        'created_at',
        'updated_at',
      ],
    });

    if (!salon) {
      logger.warn('Салон не найден', { salonId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Салон не найден',
      });
    }

    // Получаем локацию салона с координатами
    const location = await SalonLocation.findOne({
      where: { salon_id: id },
    });

    const salonData = salon.toJSON();

    if (location) {
      salonData.location = {
        id: location.id,
        city: location.city,
        address: location.address,
        coordinates: location.getCoordinates(),
        working_hours: location.working_hours,
        is_verified: location.is_verified,
      };
    }

    logger.info('Данные салона успешно получены', { salonId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      data: salonData,
    });
  } catch (error) {
    logger.error('Ошибка получения данных салона', {
      error: error.message,
      salonId: req.params.id,
      ip: req.ip,
    });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getTopMasters,
  getTopMastersController,
  getMasterById,
  getSalonById,
};
