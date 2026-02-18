const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');
const Master = require('../../user/models/Master'); // Правильный путь к модели Master
const availabilityService = require('../services/availabilityService');
const { sequelize } = require('../../../config/database');
const { Op } = require('sequelize');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('timeslot-controller');

const getMasterId = async (userId) => {
  logger.info('getMasterId вызов', { userId });
  try {
    const master = await Master.findOne({ 
      where: { user_id: userId },
      paranoid: false
    });
    logger.info('getMasterId результат', { userId, masterFound: !!master, masterId: master?.id });
    return master ? master.id : null;
  } catch (error) {
    logger.error('getMasterId ошибка', { userId, error: error.message });
    return null;
  }
};

const getMasterSlots = async (req, res) => {
  try {
    const { date, master_id } = req.query;

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

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const slots = await TimeSlot.findAll({
      where: {
        master_id: effectiveMasterId,
        start_time: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        }
      },
      order: [['start_time', 'ASC']]
    });

    logger.info('Получены слоты мастера', { masterId: effectiveMasterId, date, count: slots.length });

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    logger.error('Ошибка получения слотов мастера', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const createTimeSlot = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { start_time, end_time } = req.body;

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Пользователь не найден' });
    }

    const masterId = await getMasterId(userId);
    if (!masterId) {
      return res.status(400).json({ success: false, message: 'Профиль мастера не найден' });
    }

    if (!start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Необходимо указать start_time и end_time' });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);

    if (start >= end) {
      return res.status(400).json({ success: false, message: 'Время окончания должно быть позже времени начала' });
    }


    const overlappingSlot = await TimeSlot.findOne({
      where: {
        master_id: masterId,
        [Op.or]: [
          {
            start_time: { [Op.lt]: end },
            end_time: { [Op.gt]: start }
          }
        ]
      }
    });

    if (overlappingSlot) {
      return res.status(400).json({
        success: false,
        message: 'Это время уже занято другим слотом'
      });
    }


    const overlappingBooking = await Booking.findOne({
      where: {
        master_id: masterId,
        status: { [Op.in]: ['confirmed'] },
        [Op.or]: [
          {
            start_time: { [Op.lt]: end },
            end_time: { [Op.gt]: start }
          }
        ]
      }
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Это время уже забронировано'
      });
    }

    const slot = await TimeSlot.create({
      master_id: masterId,
      start_time,
      end_time,
      status: 'free'
    }, { transaction });

    await transaction.commit();

    logger.info('Слот создан', { slotId: slot.id, masterId });

    res.status(201).json({
      success: true,
      message: 'Слот успешно создан',
      data: slot
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Ошибка создания слота', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateTimeSlot = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { start_time, end_time, status } = req.body;

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Пользователь не найден' });
    }

    const masterId = await getMasterId(userId);
    if (!masterId) {
      return res.status(400).json({ success: false, message: 'Профиль мастера не найден' });
    }

    const slot = await TimeSlot.findOne({
      where: { id, master_id: masterId }
    });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Слот не найден'
      });
    }


    if (slot.status === 'booked') {
      return res.status(400).json({
        success: false,
        message: 'Нельзя изменить забронированный слот'
      });
    }

    const updateData = {};
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);

      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Время окончания должно быть позже времени начала'
        });
      }


      const overlappingSlot = await TimeSlot.findOne({
        where: {
          master_id: masterId,
          id: { [Op.ne]: id },
          [Op.or]: [
            {
              start_time: { [Op.lt]: end },
              end_time: { [Op.gt]: start }
            }
          ]
        }
      });

      if (overlappingSlot) {
        return res.status(400).json({
          success: false,
          message: 'Это время уже занято другим слотом'
        });
      }


      const overlappingBooking = await Booking.findOne({
        where: {
          master_id: masterId,
          status: { [Op.in]: ['confirmed'] },
          [Op.or]: [
            {
              start_time: { [Op.lt]: end },
              end_time: { [Op.gt]: start }
            }
          ]
        }
      });

      if (overlappingBooking) {
        return res.status(400).json({
          success: false,
          message: 'Это время уже забронировано'
        });
      }

      updateData.start_time = start_time;
      updateData.end_time = end_time;
    }

    if (status && ['free', 'blocked'].includes(status)) {
      updateData.status = status;
    }

    await slot.update(updateData, { transaction });

    await transaction.commit();

    logger.info('Слот обновлен', { slotId: id, masterId });

    res.json({
      success: true,
      message: 'Слот успешно обновлен',
      data: slot
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Ошибка обновления слота', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteTimeSlot = async (req, res) => {
  const transaction = await sequelize.transaction();

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

    const slot = await TimeSlot.findOne({
      where: { id, master_id: masterId }
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Слот не найден' });
    }


    if (slot.status === 'booked') {
      return res.status(400).json({ success: false, message: 'Нельзя удалить забронированный слот' });
    }

    await slot.destroy({ transaction });

    await transaction.commit();

    logger.info('Слот удален', { slotId: id, masterId });

    res.json({
      success: true,
      message: 'Слот успешно удален'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Ошибка удаления слота', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const createSchedule = async (req, res) => {
  try {
    const { date, start_time, end_time, slot_duration = 60 } = req.body;

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
      parseInt(slot_duration)
    );


    const result = await availabilityService.getAvailabilityWithSlots(masterId, date);

    logger.info('Расписание создано', { masterId, date, slotsCount: result.slots.length });

    res.status(201).json({
      success: true,
      message: `Создано ${result.slots.length} слотов`,
      data: result.slots
    });
  } catch (error) {
    logger.error('Ошибка создания расписания', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getMasterSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  createSchedule
};
