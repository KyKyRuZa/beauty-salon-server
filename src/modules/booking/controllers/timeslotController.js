const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');
const availabilityService = require('../services/availabilityService');
const { sequelize } = require('../../../config/database');
const { Op } = require('sequelize');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('timeslot-controller');

/**
 * Получить слоты мастера на дату
 * GET /api/timeslots/master
 */
const getMasterSlots = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать дату'
      });
    }

    const masterId = req.user?.master?.id;
    if (!masterId) {
      return res.status(400).json({
        success: false,
        message: 'Профиль мастера не найден'
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const slots = await TimeSlot.findAll({
      where: {
        master_id: masterId,
        start_time: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        }
      },
      order: [['start_time', 'ASC']]
    });

    logger.info('Получены слоты мастера', { masterId, date, count: slots.length });

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

/**
 * Создать временной слот
 * POST /api/timeslots
 */
const createTimeSlot = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { start_time, end_time } = req.body;

    const masterId = req.user?.master?.id;
    if (!masterId) {
      return res.status(400).json({
        success: false,
        message: 'Профиль мастера не найден'
      });
    }

    if (!start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать start_time и end_time'
      });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Время окончания должно быть позже времени начала'
      });
    }

    // Проверка на пересечение с существующими слотами
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

    // Проверка на пересечение с бронированиями
    const overlappingBooking = await Booking.findOne({
      where: {
        master_id: masterId,
        status: { [Op.in]: ['pending', 'confirmed'] },
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

/**
 * Обновить временной слот
 * PUT /api/timeslots/:id
 */
const updateTimeSlot = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { start_time, end_time, status } = req.body;

    const masterId = req.user?.master?.id;
    if (!masterId) {
      return res.status(400).json({
        success: false,
        message: 'Профиль мастера не найден'
      });
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

    // Нельзя редактировать забронированный слот
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

      // Проверка на пересечение с другими слотами
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

      // Проверка на пересечение с бронированиями
      const overlappingBooking = await Booking.findOne({
        where: {
          master_id: masterId,
          status: { [Op.in]: ['pending', 'confirmed'] },
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

/**
 * Удалить временной слот
 * DELETE /api/timeslots/:id
 */
const deleteTimeSlot = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const masterId = req.user?.master?.id;
    if (!masterId) {
      return res.status(400).json({
        success: false,
        message: 'Профиль мастера не найден'
      });
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

    // Нельзя удалить забронированный слот
    if (slot.status === 'booked') {
      return res.status(400).json({
        success: false,
        message: 'Нельзя удалить забронированный слот'
      });
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

/**
 * Пакетное создание слотов по расписанию
 * POST /api/timeslots/schedule
 */
const createSchedule = async (req, res) => {
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

    // Используем availabilityService для создания расписания и генерации слотов
    await availabilityService.setAvailability(
      masterId,
      date,
      start_time,
      end_time,
      parseInt(slot_duration)
    );

    // Получаем расписание со слотами
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
