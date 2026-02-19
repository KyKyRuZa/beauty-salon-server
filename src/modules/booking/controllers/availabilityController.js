const availabilityService = require('../services/availabilityService');
const Master = require('../../user/models/Master');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('availability-controller');

const getMasterId = async (userId) => {
  logger.info('getMasterId вызов', { userId });
  try {
    const master = await Master.findOne({
      where: { user_id: userId },
      paranoid: false
    });
    logger.info('getMasterId результат', { userId, masterFound: !!master, masterId: master?.id, masterData: master?.toJSON() });
    return master ? master.id : null;
  } catch (error) {
    logger.error('getMasterId ошибка', { userId, error: error.message });
    return null;
  }
};

// Получить доступные даты мастера (публичный endpoint)
const getAvailableDates = async (req, res) => {
  try {
    const { master_id, service_id, start_date, end_date } = req.query;

    if (!master_id) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать master_id'
      });
    }

    const dates = await availabilityService.getAvailableDates(
      master_id,
      service_id,
      start_date,
      end_date
    );

    res.json({
      success: true,
      data: dates
    });
  } catch (error) {
    logger.error('Ошибка получения доступных дат', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const setAvailability = async (req, res) => {
  try {
    const { date, start_time, end_time, slot_duration = 60, service_id } = req.body;

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Пользователь не найден' });
    }

    const masterId = await getMasterId(userId);
    if (!masterId) {
      return res.status(400).json({ success: false, message: 'Профиль мастера не найден' });
    }

    if (!date || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Необходимо указать date, start_time и end_time' });
    }

    await availabilityService.setAvailability(
      masterId,
      date,
      start_time,
      end_time,
      parseInt(slot_duration),
      service_id ? parseInt(service_id) : null
    );
    logger.info('Расписание установлено', { masterId, date, serviceId: service_id });

    res.json({ success: true, message: 'Расписание успешно установлено' });
  } catch (error) {
    logger.error('Ошибка установки расписания', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAvailability = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Пользователь не найден' });
    }

    const masterId = await getMasterId(userId);
    if (!masterId) {
      return res.status(400).json({ success: false, message: 'Профиль мастера не найден' });
    }

    const { start_date, end_date } = req.query;
    const availability = await availabilityService.getAvailability(masterId, start_date, end_date);

    res.json({ success: true, data: availability });
  } catch (error) {
    logger.error('Ошибка получения расписания', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAvailabilityWithSlots = async (req, res) => {
  try {
    const { date } = req.params;
    const { master_id, service_id } = req.query; // master_id и service_id из параметров запроса

    logger.info('getAvailabilityWithSlots запрос:', { date, master_id, service_id, userId: req.user?.userId || req.user?.id });

    if (!date) {
      return res.status(400).json({ success: false, message: 'Необходимо указать дату' });
    }

    // Если master_id не передан, пытаемся получить из токена (для мастеров)
    let effectiveMasterId = master_id ? parseInt(master_id) : null;

    if (!effectiveMasterId) {
      const userId = req.user?.userId || req.user?.id;
      if (userId) {
        effectiveMasterId = await getMasterId(userId);
      }
    }

    if (!effectiveMasterId) {
      return res.status(400).json({ success: false, message: 'Необходимо указать master_id' });
    }

    logger.info('getAvailabilityWithSlots masterId:', { masterId: effectiveMasterId, date, serviceId: service_id });

    const result = await availabilityService.getAvailabilityWithSlots(
      effectiveMasterId,
      date,
      service_id ? parseInt(service_id) : null
    );

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

const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Пользователь не найден' });
    }

    const masterId = await getMasterId(userId);
    if (!masterId) {
      return res.status(400).json({ success: false, message: 'Профиль мастера не найден' });
    }

    const availability = await availabilityService.updateAvailability(id, masterId, updateData);
    logger.info('Расписание обновлено', { availabilityId: id });

    res.json({ success: true, message: 'Расписание обновлено', data: availability });
  } catch (error) {
    logger.error('Ошибка обновления расписания', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Пользователь не найден' });
    }

    const masterId = await getMasterId(userId);
    if (!masterId) {
      return res.status(400).json({ success: false, message: 'Профиль мастера не найден' });
    }

    await availabilityService.deleteAvailability(id, masterId);
    logger.info('Расписание удалено', { availabilityId: id });

    res.json({ success: true, message: 'Расписание удалено' });
  } catch (error) {
    logger.error('Ошибка удаления расписания', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

const regenerateSlots = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Пользователь не найден' });
    }

    const masterId = await getMasterId(userId);
    if (!masterId) {
      return res.status(400).json({ success: false, message: 'Профиль мастера не найден' });
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
  regenerateSlots,
  getAvailableDates
};
