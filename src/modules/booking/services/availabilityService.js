const MasterAvailability = require('../models/MasterAvailability');
const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');
const { sequelize } = require('../../../config/database');
const { Op } = require('sequelize');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('availability-service');

// Получить доступные даты мастера
const getAvailableDates = async (masterId, serviceId = null, startDate = null, endDate = null) => {
  const where = {
    master_id: masterId,
    is_available: true
  };

  // Если указан service_id, ищем расписание для этой услуги или универсальное
  if (serviceId) {
    where[Op.or] = [
      { service_id: serviceId },
      { service_id: null }
    ];
  }

  // Фильтр по датам
  if (startDate && endDate) {
    where.date = {
      [Op.gte]: startDate,
      [Op.lte]: endDate
    };
  } else if (startDate) {
    where.date = { [Op.gte]: startDate };
  } else if (endDate) {
    where.date = { [Op.lte]: endDate };
  }

  const availability = await MasterAvailability.findAll({
    where,
    attributes: ['date', 'start_time', 'end_time', 'slot_duration', 'service_id'],
    order: [['date', 'ASC']]
  });

  // Возвращаем только даты
  return availability.map(a => ({
    date: a.date,
    start_time: a.start_time,
    end_time: a.end_time,
    slot_duration: a.slot_duration,
    service_id: a.service_id
  }));
};

const setAvailability = async (masterId, date, startTime, endTime, slotDuration = 60, serviceId = null) => {
  logger.info('setAvailability вызов', { masterId, date, startTime, endTime, slotDuration, serviceId });

  const transaction = await sequelize.transaction();

  try {
    const existing = await MasterAvailability.findOne({
      where: { master_id: masterId, date }
    });

    logger.info('setAvailability поиск существующего расписания', {
      masterId,
      date,
      found: !!existing
    });

    if (existing) {
      await existing.update({
        start_time: startTime,
        end_time: endTime,
        slot_duration: slotDuration,
        service_id: serviceId,
        is_available: true
      }, { transaction });

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
      const newAvailability = await MasterAvailability.create({
        master_id: masterId,
        date,
        start_time: startTime,
        end_time: endTime,
        slot_duration: slotDuration,
        service_id: serviceId,
        is_available: true
      }, { transaction });

      logger.info('setAvailability создано новое расписание', {
        masterId,
        date,
        availabilityId: newAvailability.id,
        serviceId
      });
    }

    await generateTimeSlots(masterId, date, startTime, endTime, slotDuration, transaction, serviceId);

    await transaction.commit();

    logger.info('Расписание установлено', { masterId, date, startTime, endTime });

    return true;
  } catch (error) {
    await transaction.rollback();
    logger.error('Ошибка установки расписания', { error: error.message });
    throw error;
  }
};

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


    if (updateData.start_time || updateData.end_time || updateData.slot_duration || updateData.service_id) {

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


      await generateTimeSlots(
        masterId,
        availability.date,
        updateData.start_time || availability.start_time,
        updateData.end_time || availability.end_time,
        updateData.slot_duration || availability.slot_duration,
        transaction,
        updateData.service_id !== undefined ? updateData.service_id : availability.service_id
      );
    }


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

const deleteAvailability = async (availabilityId, masterId) => {
  const transaction = await sequelize.transaction();

  try {
    const availability = await MasterAvailability.findOne({
      where: { id: availabilityId, master_id: masterId }
    });

    if (!availability) {
      throw new Error('Расписание не найдено');
    }


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

const generateTimeSlots = async (masterId, date, startTime, endTime, slotDuration, transaction, serviceId = null) => {
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

    const durationMs = slotDuration * 60000;
    const slots = [];

    let currentTime = new Date(dayStart);

    while (currentTime < dayEnd) {
      const slotEnd = new Date(currentTime.getTime() + durationMs);

      if (slotEnd > dayEnd) break;

      // Сохраняем время в локальном формате (без конвертации в UTC)
      // Формат: YYYY-MM-DDTHH:mm:ss
      const formatLocalTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      slots.push({
        master_id: masterId,
        service_id: serviceId, // Привязка к услуге
        start_time: formatLocalTime(currentTime),
        end_time: formatLocalTime(slotEnd),
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

const getAvailabilityWithSlots = async (masterId, date) => {
  logger.info('getAvailabilityWithSlots вызов', { masterId, date });
  
  const availability = await MasterAvailability.findOne({
    where: { master_id: masterId, date }
  });

  logger.info('getAvailabilityWithSlots результат поиска расписания', { 
    masterId, 
    date, 
    found: !!availability,
    availabilityData: availability ? availability.toJSON() : null 
  });

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

  logger.info('getAvailabilityWithSlots результат поиска слотов', { 
    masterId, 
    date, 
    slotsCount: slots.length 
  });

  // Если расписания нет, но слоты есть - возвращаем их
  if (!availability && slots.length === 0) {
    return null;
  }

  return {
    ...(availability ? availability.toJSON() : { master_id: masterId, date }),
    slots
  };
};

const regenerateSlotsForDate = async (masterId, date) => {
  const transaction = await sequelize.transaction();

  try {
    const availability = await MasterAvailability.findOne({
      where: { master_id: masterId, date }
    });

    if (!availability) {
      throw new Error('Расписание не найдено');
    }


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


    await generateTimeSlots(
      masterId,
      date,
      availability.start_time,
      availability.end_time,
      availability.slot_duration,
      transaction,
      availability.service_id
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
  regenerateSlotsForDate,
  getAvailableDates
};
