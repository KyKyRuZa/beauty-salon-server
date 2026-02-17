const availabilityService = require('../services/availabilityService');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('availability-controller');

/**
 * Создать или обновить расписание мастера на дату
 * POST /api/availability
 */
const setAvailability = async (req, res) => {
  try {
    const { date, start_time, end_time, slot_duration = 60 } = req.body;

    const masterId = req.user?.master?.id;
    if (!masterId) {
      return res.status(400).json({
        success: false,
        message: 'Профиль мастера не найден'
      });
    }

    if (!date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать date, start_time и end_time'
      });
    }

    await availabilityService.setAvailability(
      masterId,
      date,
      start_time,
      end_time,
      parseInt(slot_duration)
    );

    logger.info('Расписание установлено', { masterId, date });

    res.json({
      success: true,
      message: 'Расписание успешно установлено'
    });
  } catch (error) {
    logger.error('Ошибка установки расписания', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Получить расписание мастера
 * GET /api/availability
 */
const getAvailability = async (req, res) => {
  try {
    const masterId = req.user?.master?.id;
    if (!masterId) {
      return res.status(400).json({
        success: false,
        message: 'Профиль мастера не найден'
      });
    }

    const { start_date, end_date } = req.query;

    const availability = await availabilityService.getAvailability(
      masterId,
      start_date,
      end_date
    );

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    logger.error('Ошибка получения расписания', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Получить расписание с слотами на дату
 * GET /api/availability/:date
 */
const getAvailabilityWithSlots = async (req, res) => {
  try {
    const masterId = req.user?.master?.id;
    if (!masterId) {
      return res.status(400).json({
        success: false,
        message: 'Профиль мастера не найден'
      });
    }

    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать дату'
      });
    }

    const result = await availabilityService.getAvailabilityWithSlots(masterId, date);

    if (!result) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Ошибка получения расписания со слотами', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Обновить расписание
 * PUT /api/availability/:id
 */
const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const masterId = req.user?.master?.id;
    if (!masterId) {
      return res.status(400).json({
        success: false,
        message: 'Профиль мастера не найден'
      });
    }

    const availability = await availabilityService.updateAvailability(id, masterId, updateData);

    logger.info('Расписание обновлено', { availabilityId: id });

    res.json({
      success: true,
      message: 'Расписание обновлено',
      data: availability
    });
  } catch (error) {
    logger.error('Ошибка обновления расписания', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Удалить расписание
 * DELETE /api/availability/:id
 */
const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const masterId = req.user?.master?.id;
    if (!masterId) {
      return res.status(400).json({
        success: false,
        message: 'Профиль мастера не найден'
      });
    }

    await availabilityService.deleteAvailability(id, masterId);

    logger.info('Расписание удалено', { availabilityId: id });

    res.json({
      success: true,
      message: 'Расписание удалено'
    });
  } catch (error) {
    logger.error('Ошибка удаления расписания', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Перегенерировать слоты для даты
 * POST /api/availability/:id/regenerate
 */
const regenerateSlots = async (req, res) => {
  try {
    const { id } = req.params;

    const masterId = req.user?.master?.id;
    if (!masterId) {
      return res.status(400).json({
        success: false,
        message: 'Профиль мастера не найден'
      });
    }

    const availability = await availabilityService.getAvailability(masterId).then(
      result => result.find(a => a.id === parseInt(id))
    );

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Расписание не найдено'
      });
    }

    await availabilityService.regenerateSlotsForDate(masterId, availability.date);

    logger.info('Слоты перегенерированы', { availabilityId: id });

    res.json({
      success: true,
      message: 'Слоты перегенерированы'
    });
  } catch (error) {
    logger.error('Ошибка перегенерации слотов', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  setAvailability,
  getAvailability,
  getAvailabilityWithSlots,
  updateAvailability,
  deleteAvailability,
  regenerateSlots
};
