const MasterAvailability = require('../models/MasterAvailability');
const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');
const { sequelize } = require('../../../config/database');
const { Op } = require('sequelize');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('availability-service');

/**
 * Создать или обновить расписание мастера на дату
 */
const setAvailability = async (masterId, date, startTime, endTime, slotDuration = 60) => {
  const transaction = await sequelize.transaction();

  try {
    // Проверяем существующую запись
    const existing = await MasterAvailability.findOne({
      where: { master_id: masterId, date }
    });

    if (existing) {
      // Обновляем существующую запись
      await existing.update({
        start_time: startTime,
        end_time: endTime,
        slot_duration: slotDuration,
        is_available: true
      }, { transaction });

      // Удаляем старые слоты для этой даты
      await TimeSlot.destroy({
        where: {
          master_id: masterId,
          start_time: {
            [Op.gte]: new Date(date + 'T00:00:00'),
            [Op.lt]: new Date(date + 'T23:59:59')
          }
        },
        transaction
      });
    } else {
      // Создаём новую запись
      await MasterAvailability.create({
        master_id: masterId,
        date,
        start_time: startTime,
        end_time: endTime,
        slot_duration: slotDuration,
        is_available: true
      }, { transaction });
    }

    // Генерируем слоты
    await generateTimeSlots(masterId, date, startTime, endTime, slotDuration, transaction);

    await transaction.commit();

    logger.info('Расписание установлено', { masterId, date, startTime, endTime });

    return true;
  } catch (error) {
    await transaction.rollback();
    logger.error('Ошибка установки расписания', { error: error.message });
    throw error;
  }
};

/**
 * Получить расписание мастера
 */
const getAvailability = async (masterId, startDate, endDate) => {
  const where = { master_id: masterId };

  if (startDate && endDate) {
    where.date = {
      [Op.gte]: startDate,
      [Op.lte]: endDate
    };
  } else if (startDate) {
    where.date = { [Op.gte]: startDate };
  }

  const availability = await MasterAvailability.findAll({
    where,
    order: [['date', 'ASC']]
  });

  return availability;
};

/**
 * Обновить расписание
 */
const updateAvailability = async (availabilityId, masterId, updateData) => {
  const transaction = await sequelize.transaction();

  try {
    const availability = await MasterAvailability.findOne({
      where: { id: availabilityId, master_id: masterId }
    });

    if (!availability) {
      throw new Error('Расписание не найдено');
    }

    await availability.update(updateData, { transaction });

    // Если изменилось время или длительность слота, перегенерируем слоты
    if (updateData.start_time || updateData.end_time || updateData.slot_duration) {
      // Удаляем старые слоты
      await TimeSlot.destroy({
        where: {
          master_id: masterId,
          start_time: {
            [Op.gte]: new Date(availability.date + 'T00:00:00'),
            [Op.lt]: new Date(availability.date + 'T23:59:59')
          }
        },
        transaction
      });

      // Генерируем новые
      await generateTimeSlots(
        masterId,
        availability.date,
        updateData.start_time || availability.start_time,
        updateData.end_time || availability.end_time,
        updateData.slot_duration || availability.slot_duration,
        transaction
      );
    }

    // Если is_available = false, блокируем все слоты
    if (updateData.is_available === false) {
      await TimeSlot.update(
        { status: 'blocked' },
        {
          where: {
            master_id: masterId,
            start_time: {
              [Op.gte]: new Date(availability.date + 'T00:00:00'),
              [Op.lt]: new Date(availability.date + 'T23:59:59')
            }
          },
          transaction
        }
      );
    }

    await transaction.commit();

    logger.info('Расписание обновлено', { availabilityId });

    return availability;
  } catch (error) {
    await transaction.rollback();
    logger.error('Ошибка обновления расписания', { error: error.message });
    throw error;
  }
};

/**
 * Удалить расписание
 */
const deleteAvailability = async (availabilityId, masterId) => {
  const transaction = await sequelize.transaction();

  try {
    const availability = await MasterAvailability.findOne({
      where: { id: availabilityId, master_id: masterId }
    });

    if (!availability) {
      throw new Error('Расписание не найдено');
    }

    // Удаляем слоты, которые не забронированы
    await TimeSlot.destroy({
      where: {
        master_id: masterId,
        start_time: {
          [Op.gte]: new Date(availability.date + 'T00:00:00'),
          [Op.lt]: new Date(availability.date + 'T23:59:59')
        },
        status: { [Op.ne]: 'booked' }
      },
      transaction
    });

    // Удаляем расписание
    await availability.destroy({ transaction });

    await transaction.commit();

    logger.info('Расписание удалено', { availabilityId });

    return true;
  } catch (error) {
    await transaction.rollback();
    logger.error('Ошибка удаления расписания', { error: error.message });
    throw error;
  }
};

/**
 * Сгенерировать временные слоты из расписания
 */
const generateTimeSlots = async (masterId, date, startTime, endTime, slotDuration, transaction) => {
  try {
    const baseDate = new Date(date + 'T00:00:00');
    const [startHour, startMin, startSec] = startTime.split(':').map(Number);
    const [endHour, endMin, endSec] = endTime.split(':').map(Number);

    const dayStart = new Date(baseDate);
    dayStart.setHours(startHour, startMin || 0, startSec || 0, 0);

    const dayEnd = new Date(baseDate);
    dayEnd.setHours(endHour, endMin || 0, endSec || 0, 0);

    if (dayStart >= dayEnd) {
      throw new Error('Время окончания должно быть позже времени начала');
    }

    const durationMs = slotDuration * 60000; // минуты в миллисекунды
    const slots = [];

    let currentTime = new Date(dayStart);

    while (currentTime < dayEnd) {
      const slotEnd = new Date(currentTime.getTime() + durationMs);

      if (slotEnd > dayEnd) break;

      slots.push({
        master_id: masterId,
        start_time: currentTime.toISOString(),
        end_time: slotEnd.toISOString(),
        status: 'free',
        source: 'auto',
        created_at: new Date()
      });

      currentTime = slotEnd;
    }

    if (slots.length > 0) {
      await TimeSlot.bulkCreate(slots, { transaction });
      logger.info('Слоты сгенерированы', { masterId, date, count: slots.length });
    }

    return slots;
  } catch (error) {
    logger.error('Ошибка генерации слотов', { error: error.message });
    throw error;
  }
};

/**
 * Получить расписание мастера с слотами
 */
const getAvailabilityWithSlots = async (masterId, date) => {
  const availability = await MasterAvailability.findOne({
    where: { master_id: masterId, date }
  });

  if (!availability) {
    return null;
  }

  const startOfDay = new Date(date + 'T00:00:00');
  const endOfDay = new Date(date + 'T23:59:59');

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

  return {
    ...availability.toJSON(),
    slots
  };
};

/**
 * Перегенерировать слоты для даты
 */
const regenerateSlotsForDate = async (masterId, date) => {
  const transaction = await sequelize.transaction();

  try {
    const availability = await MasterAvailability.findOne({
      where: { master_id: masterId, date }
    });

    if (!availability) {
      throw new Error('Расписание не найдено');
    }

    // Сохраняем забронированные слоты
    const bookedSlots = await TimeSlot.findAll({
      where: {
        master_id: masterId,
        start_time: {
          [Op.gte]: new Date(date + 'T00:00:00'),
          [Op.lt]: new Date(date + 'T23:59:59')
        },
        status: 'booked'
      },
      transaction
    });

    // Удаляем все слоты кроме забронированных
    await TimeSlot.destroy({
      where: {
        master_id: masterId,
        start_time: {
          [Op.gte]: new Date(date + 'T00:00:00'),
          [Op.lt]: new Date(date + 'T23:59:59')
        },
        status: { [Op.ne]: 'booked' }
      },
      transaction
    });

    // Генерируем новые слоты
    await generateTimeSlots(
      masterId,
      date,
      availability.start_time,
      availability.end_time,
      availability.slot_duration,
      transaction
    );

    await transaction.commit();

    logger.info('Слоты перегенерированы', { masterId, date, bookedSlotsCount: bookedSlots.length });

    return true;
  } catch (error) {
    await transaction.rollback();
    logger.error('Ошибка перегенерации слотов', { error: error.message });
    throw error;
  }
};

module.exports = {
  setAvailability,
  getAvailability,
  updateAvailability,
  deleteAvailability,
  generateTimeSlots,
  getAvailabilityWithSlots,
  regenerateSlotsForDate
};
