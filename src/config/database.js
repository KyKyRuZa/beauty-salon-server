const { Sequelize } = require('sequelize');
const { createLogger } = require('../utils/logger');

const dbLogger = createLogger('database');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'beauty_vite_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '563478',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'postgres',
    port: process.env.DB_PORT || 5432,

    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },

    // Установка схем по умолчанию для каждой области
    schema: 'public', // основная схема, но мы будем переопределять в моделях

    logging: (msg) => dbLogger.debug(msg),

    // Дополнительные настройки для работы в Docker
    retry: {
      max: parseInt(process.env.DB_RETRY_MAX) || 3
    },
    
    // Настройки SSL (если требуется для production)
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

function importModels() {
  // User models - import in the right order to respect foreign key constraints
  const User = require('../modules/user/models/User');
  const Salon = require('../modules/user/models/Salon'); // Import first since other user models reference it
  const Client = require('../modules/user/models/Client');
  const Master = require('../modules/user/models/Master');
  const Review = require('../modules/user/models/Review');
  const Favorite = require('../modules/user/models/Favorite');

  // Admin models
  const Admin = require('../modules/admin/models/Admin');

  // Catalog models - import in the right order to respect foreign key constraints
  const ServiceCategory = require('../modules/catalog/models/ServiceCategory'); // First import parent table
  const ServiceSubcategory = require('../modules/catalog/models/ServiceSubcategory');
  const MasterService = require('../modules/catalog/models/MasterService'); // Updated to use master-service relations
  const TimeSlot = require('../modules/booking/models/TimeSlot'); // Time slots for bookings

  // Booking models
  const Booking = require('../modules/booking/models/Booking');
  const MasterAvailability = require('../modules/booking/models/MasterAvailability');

  return { User, Client, Master, Salon, Admin, ServiceCategory, ServiceSubcategory, MasterService, TimeSlot, Booking, MasterAvailability, Review, Favorite };
}

function defineAssociations(models) {
  const { defineAssociations } = require('./associations');
  defineAssociations(models);
}

const connectDB = async () => {
  try {
    const models = importModels();
    defineAssociations(models);

    await sequelize.authenticate();
    dbLogger.info('Соединение с базой данных успешно установлено.', {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'beauty_vite_db',
      dialect: process.env.DB_DIALECT || 'postgres'
    });
    
    await models.User.sync();

    await models.Salon.sync();
    await models.Client.sync();
    await models.Master.sync();

    await models.Admin.sync();

    await models.ServiceCategory.sync();
    await models.ServiceSubcategory.sync();
    await models.MasterService.sync();

    await models.TimeSlot.sync();

    await models.Booking.sync();
    await models.MasterAvailability.sync();

    await models.Review.sync();

    await models.Favorite.sync();

    dbLogger.info('База данных синхронизирована.');
  } catch (error) {
    dbLogger.error('Невозможно подключиться к базе данных:', error);
    throw error;
  }
};

module.exports = { sequelize, connectDB };