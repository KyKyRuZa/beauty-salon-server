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

/**
 * Создать новую запись
 */
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

    // Проверка: клиент существует
    const client = await Client.findByPk(client_id);
    if (!client) {
      throw new Error('Клиент не найден');
    }

    // Проверка: мастер существует
    const master = await Master.findByPk(master_id);
    if (!master) {
      throw new Error('Мастер не найден');
    }

    // Проверка: услуга существует и принадлежит мастеру
    const service = await MasterService.findOne({
      where: {
        id: master_service_id,
        master_id
      }
    });
    if (!service) {
      throw new Error('Услуга не найдена или не принадлежит мастеру');
    }

    // Проверка: нет ли пересекающихся записей у мастера
    const overlappingBooking = await Booking.findOne({
      where: {
        master_id,
        status: { [Op.in]: ['pending', 'confirmed'] },
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

    // Если указан time_slot_id, проверяем его статус
    if (time_slot_id) {
      const timeSlot = await TimeSlot.findByPk(time_slot_id);
      if (!timeSlot) {
        throw new Error('Временной слот не найден');
      }
      if (timeSlot.status !== 'free') {
        throw new Error('Это время уже забронировано');
      }
      // Помечаем слот как забронированный
      await timeSlot.update({ status: 'booked' }, { transaction });
    }

    // Создаём бронирование
    const booking = await Booking.create({
      client_id,
      master_id,
      master_service_id,
      time_slot_id,
      start_time,
      end_time,
      status: 'pending', // по умолчанию ожидает подтверждения мастера
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

/**
 * Получить все записи клиента
 */
const getClientBookings = async (clientId, options = {}) => {
  const { status, limit = 50, offset = 0 } = options;

  const where = { client_id: clientId };
  if (status) {
    // Поддержка как одиночного статуса, так и массива
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
        as: 'booking_master'
      }
    ],
    order: [['start_time', 'ASC']],
    limit,
    offset
  });

  logger.info('Получены записи клиента', { clientId, count: bookings.length });
  return bookings;
};

/**
 * Получить все записи мастера
 */
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

/**
 * Получить запись по ID
 */
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

/**
 * Обновить статус бронирования
 */
const updateBookingStatus = async (bookingId, status) => {
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new Error('Неверный статус');
  }

  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    throw new Error('Бронирование не найдено');
  }

  // Если отменяем бронирование, освобождаем слот
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

/**
 * Обновить бронирование (время, комментарий)
 */
const updateBooking = async (bookingId, updateData) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    throw new Error('Бронирование не найдено');
  }

  // Нельзя изменить завершённое или отменённое бронирование
  if (['completed', 'cancelled'].includes(booking.status)) {
    throw new Error('Нельзя изменить отменённое или завершённое бронирование');
  }

  // Если меняем время, проверяем на пересечения
  if (updateData.start_time || updateData.end_time) {
    const startTime = updateData.start_time || booking.start_time;
    const endTime = updateData.end_time || booking.end_time;

    const overlappingBooking = await Booking.findOne({
      where: {
        master_id: booking.master_id,
        id: { [Op.ne]: bookingId },
        status: { [Op.in]: ['pending', 'confirmed'] },
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

/**
 * Отменить бронирование
 */
const cancelBooking = async (bookingId) => {
  return updateBookingStatus(bookingId, 'cancelled');
};

/**
 * Подтвердить бронирование (для мастера)
 */
const confirmBooking = async (bookingId) => {
  return updateBookingStatus(bookingId, 'confirmed');
};

/**
 * Получить доступные слоты для мастера на дату
 * Если слоты есть в БД, возвращает их
 * Если есть расписание (MasterAvailability), но нет слотов — генерирует их
 * Если нет расписания — возвращает пустой массив
 */
const getAvailableSlots = async (masterId, date, serviceId) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Получаем все слоты мастера на эту дату
    const slots = await TimeSlot.findAll({
      where: {
        master_id: masterId,
        start_time: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        },
        status: 'free'
      }
    });

    // Если слоты есть, фильтруем забронированные
    if (slots.length > 0) {
      // Получаем все бронирования мастера на эту дату
      const bookings = await Booking.findAll({
        where: {
          master_id,
          status: { [Op.in]: ['pending', 'confirmed'] },
          start_time: {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay
          }
        }
      });

      // Фильтруем слоты, исключая забронированные
      const availableSlots = slots.filter(slot => {
        const slotStart = new Date(slot.start_time);
        const slotEnd = new Date(slot.end_time);

        return !bookings.some(booking => {
          const bookingStart = new Date(booking.start_time);
          const bookingEnd = new Date(booking.end_time);
          return (slotStart < bookingEnd && slotEnd > bookingStart);
        });
      });

      logger.info('Получены доступные слоты из БД', { masterId, date, count: availableSlots.length });
      return availableSlots;
    }

    // Если слотов нет, проверяем наличие расписания
    const availability = await MasterAvailability.findOne({
      where: {
        master_id: masterId,
        date,
        is_available: true
      }
    });

    if (availability) {
      // Расписание есть, но слотов нет — генерируем их
      const availabilityService = require('./availabilityService');
      await availabilityService.generateTimeSlots(
        masterId,
        date,
        availability.start_time,
        availability.end_time,
        availability.slot_duration
      );

      // Получаем сгенерированные слоты
      const newSlots = await TimeSlot.findAll({
        where: {
          master_id: masterId,
          start_time: {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay
          },
          status: 'free'
        }
      });

      logger.info('Слоты сгенерированы из расписания', { masterId, date, count: newSlots.length });
      return newSlots;
    }
  } catch (error) {
    logger.warn('Ошибка получения слотов', { error: error.message });
  }

  // Если нет расписания, возвращаем пустой массив
  logger.info('Нет расписания или слотов', { masterId, date });
  return [];
};

/**
 * Получить свободные окна для записи (группировка по времени)
 */
const getFreeTimeWindows = async (masterId, date, serviceDuration = 60) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Получаем все бронирования мастера на эту дату
  const bookings = await Booking.findAll({
    where: {
      master_id: masterId,
      status: { [Op.in]: ['pending', 'confirmed'] },
      start_time: {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      }
    },
    order: [['start_time', 'ASC']]
  });

  // Получаем рабочие часы мастера (из TimeSlot)
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
    return []; // Мастер не работает в этот день
  }

  // Находим свободные окна
  const freeWindows = [];
  let currentTime = new Date(workingSlots[0].start_time);
  const dayEnd = new Date(workingSlots[workingSlots.length - 1].end_time);

  while (currentTime < dayEnd) {
    const windowEnd = new Date(currentTime.getTime() + serviceDuration * 60000);

    // Проверяем, не пересекается ли с бронированиями
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

    // Переходим к следующему окну (шаг 30 минут)
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
