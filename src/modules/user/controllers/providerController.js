const Master = require('../models/Master');
const Salon = require('../models/Salon');
const { createLogger } = require('../../../utils/logger');

// Create a logger instance for this controller
const logger = createLogger('provider-controller');

// Get master by ID
const getMasterById = async (req, res) => {
  logger.info('Получение данных мастера по ID', { masterId: req.params.id, ip: req.ip });

  try {
    const { id } = req.params;

    const master = await Master.findByPk(id, {
      attributes: ['id', 'user_id', 'first_name', 'last_name', 'specialization', 'experience', 'rating', 'bio', 'is_available', 'image_url', 'salon_id', 'created_at', 'updated_at'],
      include: [
        {
          model: require('../models/Salon'),
          as: 'salon',
          attributes: ['id', 'name', 'address']
        }
      ]
    });

    if (!master) {
      logger.warn('Мастер не найден', { masterId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Мастер не найден'
      });
    }

    logger.info('Данные мастера успешно получены', { masterId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      data: {
        ...master.toJSON(),
        address: master.salon?.address || 'Адрес не указан'
      }
    });
  } catch (error) {
    logger.error('Ошибка получения данных мастера', { error: error.message, masterId: req.params.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get salon by ID
const getSalonById = async (req, res) => {
  logger.info('Получение данных салона по ID', { salonId: req.params.id, ip: req.ip });

  try {
    const { id } = req.params;

    const salon = await Salon.findByPk(id, {
      attributes: ['id', 'user_id', 'name', 'description', 'address', 'inn', 'rating', 'image_url', 'created_at', 'updated_at']
    });

    if (!salon) {
      logger.warn('Салон не найден', { salonId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Салон не найден'
      });
    }

    logger.info('Данные салона успешно получены', { salonId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      data: salon
    });
  } catch (error) {
    logger.error('Ошибка получения данных салона', { error: error.message, salonId: req.params.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getMasterById,
  getSalonById
};