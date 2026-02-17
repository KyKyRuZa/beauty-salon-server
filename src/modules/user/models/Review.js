const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');
const User = require('../../user/models/User');
const Master = require('../../user/models/Master');
const Salon = require('../../user/models/Salon');
const Booking = require('../../booking/models/Booking');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: {
        schema: 'user_schema',
        tableName: 'users'
      },
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  master_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'master_id',
    references: {
      model: {
        schema: 'user_schema',
        tableName: 'masters'
      },
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  salon_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'salon_id',
    references: {
      model: {
        schema: 'user_schema',
        tableName: 'salons'
      },
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'booking_id',
    references: {
      model: {
        schema: 'booking_schema',
        tableName: 'booking'
      },
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Рейтинг должен быть не менее 1'
      },
      max: {
        args: [5],
        msg: 'Рейтинг должен быть не более 5'
      },
      isInt: {
        msg: 'Рейтинг должен быть целым числом'
      }
    },
    field: 'rating'
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Комментарий не должен превышать 1000 символов'
      }
    },
    field: 'comment'
  },
  is_visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_visible',
    comment: 'Видимость отзыва (модерация)'
  }
}, {
  tableName: 'reviews',
  schema: 'user_schema',
  indexes: [
    {
      fields: ['user_id'],
      name: 'reviews_user_id_index'
    },
    {
      fields: ['master_id'],
      name: 'reviews_master_id_index'
    },
    {
      fields: ['salon_id'],
      name: 'reviews_salon_id_index'
    },
    {
      fields: ['booking_id'],
      name: 'reviews_booking_id_index'
    },
    {
      fields: ['rating'],
      name: 'reviews_rating_index'
    },
    {
      fields: ['is_visible'],
      name: 'reviews_is_visible_index'
    },
    {
      fields: ['created_at'],
      name: 'reviews_created_at_index'
    }
  ],
  paranoid: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  validate: {
    hasMasterOrSalon() {
      if (!this.master_id && !this.salon_id) {
        throw new Error('Отзыв должен быть оставлен мастеру или салону');
      }
    },
    validBooking() {
      if (this.booking_id && !this.master_id && !this.salon_id) {
        throw new Error('При указании бронирования должен быть указан мастер или салон');
      }
    }
  }
});

// Ассоциации будут определены в associations.js
module.exports = Review;
