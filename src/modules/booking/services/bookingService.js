const Booking = require('../models/Booking');
const MasterService = require('../../catalog/models/MasterService');
const TimeSlot = require('../models/TimeSlot');
const Master = require('../../user/models/Master');
const Client = require('../../user/models/Client');
const MasterAvailability = require('../models/MasterAvailability');
const { sequelize } = require('../../../config/database');
const { Op } = require('sequelize');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('booking-service');

const createBooking = async (bookingData) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      client_id,
      master_id,
      master_service_id,
      time_slot_id,
      start_time,
      end_time,
      comment
    } = bookingData;


    const client = await Client.findByPk(client_id);
    if (!client) {
      throw new Error('Клиент не найден');
    }


    const master = await Master.findByPk(master_id);
    if (!master) {
      throw new Error('Мастер не найден');
    }


    const service = await MasterService.findOne({
      where: {
        id: master_service_id,
        master_id
      }
    });
    if (!service) {
      throw new Error('Услуга не найдена или не принадлежит мастеру');
    }


    const overlappingBooking = await Booking.findOne({
      where: {
        master_id,
        status: { [Op.in]: ['confirmed'] },
        [Op.or]: [
          {
            start_time: { [Op.lt]: end_time },
            end_time: { [Op.gt]: start_time }
          }
        ]
      }
    });

    if (overlappingBooking) {
      throw new Error('Это время уже занято');
    }


    if (time_slot_id) {
      const timeSlot = await TimeSlot.findByPk(time_slot_id);
      if (!timeSlot) {
        throw new Error('Временной слот не найден');
      }
      if (timeSlot.status !== 'free') {
        throw new Error('Это время уже забронировано');
      }

      await timeSlot.update({ status: 'booked' }, { transaction });
    }


    const booking = await Booking.create({
      client_id,
      master_id,
      master_service_id,
      time_slot_id,
      start_time,
      end_time,
      status: 'confirmed',
      comment,
      price: service.price
    }, { transaction });

    await transaction.commit();
    logger.info('Бронирование создано', { bookingId: booking.id, clientId: client_id, masterId: master_id });

    return booking;
  } catch (error) {
    await transaction.rollback();
    logger.error('Ошибка создания бронирования', { error: error.message });
    throw error;
  }
};

const getClientBookings = async (clientId, options = {}) => {
  const { status, limit = 50, offset = 0 } = options;

  const where = { client_id: clientId };
  if (status) {

    if (Array.isArray(status)) {
      where.status = { [Op.in]: status };
    } else {
      where.status = status;
    }
  }

  const bookings = await Booking.findAll({
    where,
    include: [
      {
        model: MasterService,
        as: 'service',
        include: [
          { model: Master, as: 'master_provider' }
        ]
      },
      {
        model: Master,
        as: 'booking_master',
        attributes: ['id', 'first_name', 'last_name', 'specialization', 'rating']
      }
    ],
    order: [['start_time', 'ASC']],
    limit,
    offset
  });

  logger.info('Получены записи клиента', { clientId, count: bookings.length });
  return bookings;
};

const getMasterBookings = async (masterId, options = {}) => {
  const { status, date, limit = 50, offset = 0 } = options;

  const where = { master_id: masterId };
  if (status) {
    where.status = status;
  }
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.start_time = {
      [Op.gte]: startOfDay,
      [Op.lte]: endOfDay
    };
  }

  const bookings = await Booking.findAll({
    where,
    include: [
      {
        model: MasterService,
        as: 'service'
      },
      {
        model: Client,
        as: 'client',
        include: [
          { model: require('../../user/models/User'), as: 'user' }
        ]
      }
    ],
    order: [['start_time', 'ASC']],
    limit,
    offset
  });

  logger.info('Получены записи мастера', { masterId, count: bookings.length });
  return bookings;
};

const getBookingById = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: MasterService, as: 'service' },
      { model: Master, as: 'master' },
      { model: Client, as: 'client' }
    ]
  });

  if (!booking) {
    throw new Error('Бронирование не найдено');
  }

  return booking;
};

const updateBookingStatus = async (bookingId, status) => {
  const validStatuses = ['confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new Error('Неверный статус');
  }

  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    throw new Error('Бронирование не найдено');
  }


  if (status === 'cancelled' && booking.time_slot_id) {
    const timeSlot = await TimeSlot.findByPk(booking.time_slot_id);
    if (timeSlot) {
      await timeSlot.update({ status: 'free' });
    }
  }

  await booking.update({ status });
  logger.info('Статус бронирования обновлён', { bookingId, status });

  return booking;
};

const updateBooking = async (bookingId, updateData) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    throw new Error('Бронирование не найдено');
  }


  if (['completed', 'cancelled'].includes(booking.status)) {
    throw new Error('Нельзя изменить отменённое или завершённое бронирование');
  }


  if (updateData.start_time || updateData.end_time) {
    const startTime = updateData.start_time || booking.start_time;
    const endTime = updateData.end_time || booking.end_time;

    const overlappingBooking = await Booking.findOne({
      where: {
        master_id: booking.master_id,
        id: { [Op.ne]: bookingId },
        status: { [Op.in]: ['confirmed'] },
        [Op.or]: [
          {
            start_time: { [Op.lt]: endTime },
            end_time: { [Op.gt]: startTime }
          }
        ]
      }
    });

    if (overlappingBooking) {
      throw new Error('Это время уже занято');
    }
  }

  await booking.update(updateData);
  logger.info('Бронирование обновлено', { bookingId });

  return booking;
};

const cancelBooking = async (bookingId) => {
  return updateBookingStatus(bookingId, 'cancelled');
};

const confirmBooking = async (bookingId) => {
  return updateBookingStatus(bookingId, 'confirmed');
};

const getAvailableSlots = async (masterId, date, serviceId) => {
  // Парсим дату как локальную, а не UTC
  // date приходит в формате YYYY-MM-DD
  const [year, month, day] = date.split('-');
  const startOfDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
  const endOfDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999);

  try {
    const logger = require('../../../utils/logger').createLogger('booking-service');
    logger.info('getAvailableSlots вызов', { masterId, date, serviceId });
    
    // Получаем длительность услуги, если указан service_id
    let serviceDuration = 60; // По умолчанию 60 минут
    if (serviceId) {
      const MasterService = require('../../catalog/models/MasterService');
      const service = await MasterService.findByPk(serviceId);
      if (service && service.duration) {
        serviceDuration = service.duration;
      }
    }

    // Сначала ищем слоты в БД
    const slotsWhere = {
      master_id: masterId,
      start_time: {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      },
      status: 'free'
    };

    // Если указан service_id, фильтруем по нему или по null (универсальные слоты)
    if (serviceId) {
      slotsWhere[Op.or] = [
        { service_id: serviceId },
        { service_id: null }
      ];
    }

    logger.info('getAvailableSlots поиск слотов', { slotsWhere, serviceId });

    const slots = await TimeSlot.findAll({
      where: slotsWhere
    });

    logger.info('getAvailableSlots найдено слотов', { count: slots.length, serviceId });


    if (slots.length > 0) {
      // Фильтруем слоты по длительности услуги
      const serviceDurationMs = serviceDuration * 60000;

      const bookings = await Booking.findAll({
        where: {
          master_id: masterId,
          status: { [Op.in]: ['confirmed'] },
          start_time: {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay
          }
        }
      });

      const availableSlots = slots.filter(slot => {
        const slotStart = new Date(slot.start_time);
        const slotEnd = new Date(slot.end_time);

        // Проверяем, что слот подходит по длительности
        const slotDuration = slotEnd - slotStart;
        if (slotDuration < serviceDurationMs) {
          return false;
        }

        return !bookings.some(booking => {
          const bookingStart = new Date(booking.start_time);
          const bookingEnd = new Date(booking.end_time);
          return (slotStart < bookingEnd && slotEnd > bookingStart);
        });
      });

      logger.info('Получены доступные слоты из БД', { masterId, date, count: availableSlots.length, serviceId, serviceDuration });
      return availableSlots;
    }


    const availability = await MasterAvailability.findOne({
      where: {
        master_id: masterId,
        date,
        is_available: true
      }
    });

    if (availability) {
      // Получаем длительность из расписания или используем длительность услуги
      const slotDuration = availability.slot_duration || serviceDuration;

      const availabilityService = require('./availabilityService');
      await availabilityService.generateTimeSlots(
        masterId,
        date,
        availability.start_time,
        availability.end_time,
        slotDuration,
        undefined, // transaction
        serviceId // передаём service_id для генерации слотов
      );

      // Ищем сгенерированные слоты с фильтрацией по service_id если указано
      const newSlotsWhere = {
        master_id: masterId,
        start_time: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        },
        status: 'free'
      };
      
      // Если указан service_id, фильтруем по нему или по null (универсальные)
      if (serviceId) {
        newSlotsWhere[Op.or] = [
          { service_id: serviceId },
          { service_id: null }
        ];
      }

      const newSlots = await TimeSlot.findAll({
        where: newSlotsWhere
      });

      logger.info('Слоты сгенерированы из расписания', { masterId, date, count: newSlots.length, serviceId });
      return newSlots;
    }
    
    logger.info('Возвращаем слоты', { masterId, date, count: slots.length, serviceId });
    return slots;
  } catch (error) {
    logger.error('Ошибка получения слотов', { error: error.message, masterId, date, serviceId });
    return [];
  }
};

const getFreeTimeWindows = async (masterId, date, serviceDuration = 60) => {
  // Парсим дату как локальную
  const [year, month, day] = date.split('-');
  const startOfDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
  const endOfDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999);


  const bookings = await Booking.findAll({
    where: {
      master_id: masterId,
      status: { [Op.in]: ['confirmed'] },
      start_time: {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      }
    },
    order: [['start_time', 'ASC']]
  });


  const workingSlots = await TimeSlot.findAll({
    where: {
      master_id: masterId,
      start_time: {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      }
    },
    order: [['start_time', 'ASC']]
  });

  if (workingSlots.length === 0) {
    return [];
  }


  const freeWindows = [];
  let currentTime = new Date(workingSlots[0].start_time);
  const dayEnd = new Date(workingSlots[workingSlots.length - 1].end_time);

  while (currentTime < dayEnd) {
    const windowEnd = new Date(currentTime.getTime() + serviceDuration * 60000);


    const hasConflict = bookings.some(booking => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      return (currentTime < bookingEnd && windowEnd > bookingStart);
    });

    if (!hasConflict) {
      freeWindows.push({
        start_time: currentTime.toISOString(),
        end_time: windowEnd.toISOString()
      });
    }


    currentTime = new Date(currentTime.getTime() + 30 * 60000);
  }

  return freeWindows;
};

module.exports = {
  createBooking,
  getClientBookings,
  getMasterBookings,
  getBookingById,
  updateBookingStatus,
  updateBooking,
  cancelBooking,
  confirmBooking,
  getAvailableSlots,
  getFreeTimeWindows
};
