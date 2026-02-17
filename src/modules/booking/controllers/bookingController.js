const bookingService = require('../services/bookingService');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('booking-controller');

const createBooking = async (req, res) => {
  try {
    logger.info('Запрос на создание бронирования', { userId: req.user?.id });

    const {
      master_id,
      master_service_id,
      time_slot_id,
      start_time,
      end_time,
      comment
    } = req.body;


    const client_id = req.user?.client?.id;
    if (!client_id) {
      return res.status(400).json({
        success: false,
        message: 'Профиль клиента не найден'
      });
    }


    if (!master_id || !master_service_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать master_id, master_service_id, start_time и end_time'
      });
    }

    const booking = await bookingService.createBooking({
      client_id,
      master_id,
      master_service_id,
      time_slot_id,
      start_time,
      end_time,
      comment
    });

    logger.info('Бронирование успешно создано', { bookingId: booking.id });

    res.status(201).json({
      success: true,
      message: 'Запись успешно создана',
      data: booking
    });
  } catch (error) {
    logger.error('Ошибка создания бронирования', { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getMyBookings = async (req, res) => {
  try {

    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const { status } = req.query;


    const Client = require('../../user/models/Client');
    const client = await Client.findOne({ where: { user_id: userId } });
    
    if (!client) {
      return res.status(400).json({
        success: false,
        message: 'Профиль клиента не найден'
      });
    }


    let statusFilter = null;
    if (status) {
      if (status.includes(',')) {
        statusFilter = status.split(',');
      } else {
        statusFilter = status;
      }
    }

    const bookings = await bookingService.getClientBookings(client.id, { 
      status: statusFilter 
    });

    logger.info('Получены записи клиента', { clientId: client.id, count: bookings.length });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    logger.error('Ошибка получения записей клиента', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getMasterBookings = async (req, res) => {
  try {
    const master_id = req.user?.master?.id;
    if (!master_id) {
      return res.status(400).json({
        success: false,
        message: 'Профиль мастера не найден'
      });
    }

    const { status, date } = req.query;

    const bookings = await bookingService.getMasterBookings(master_id, { status, date });

    logger.info('Получены записи мастера', { masterId: master_id, count: bookings.length });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    logger.error('Ошибка получения записей мастера', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await bookingService.getBookingById(id);

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error('Ошибка получения бронирования', { error: error.message });
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const booking = await bookingService.updateBooking(id, updateData);

    logger.info('Бронирование обновлено', { bookingId: id });

    res.json({
      success: true,
      message: 'Бронирование обновлено',
      data: booking
    });
  } catch (error) {
    logger.error('Ошибка обновления бронирования', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await bookingService.cancelBooking(id);

    logger.info('Бронирование отменено', { bookingId: id });

    res.json({
      success: true,
      message: 'Бронирование отменено',
      data: booking
    });
  } catch (error) {
    logger.error('Ошибка отмены бронирования', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await bookingService.confirmBooking(id);

    logger.info('Бронирование подтверждено', { bookingId: id });

    res.json({
      success: true,
      message: 'Бронирование подтверждено',
      data: booking
    });
  } catch (error) {
    logger.error('Ошибка подтверждения бронирования', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    const { master_id, date, service_id } = req.query;

    if (!master_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать master_id и date'
      });
    }

    const slots = await bookingService.getAvailableSlots(master_id, date, service_id);

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    logger.error('Ошибка получения доступных слотов', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getFreeWindows = async (req, res) => {
  try {
    const { master_id, date, duration = 60 } = req.query;

    if (!master_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать master_id и date'
      });
    }

    const windows = await bookingService.getFreeTimeWindows(
      master_id,
      date,
      parseInt(duration)
    );

    res.json({
      success: true,
      data: windows
    });
  } catch (error) {
    logger.error('Ошибка получения свободных окон', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getMasterBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  confirmBooking,
  getAvailableSlots,
  getFreeWindows
};
