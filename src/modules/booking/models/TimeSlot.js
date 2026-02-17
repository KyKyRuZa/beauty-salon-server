const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const TimeSlot = sequelize.define('TimeSlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  master_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'master_id',
    comment: 'ID мастера'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_time',
    comment: 'Время начала слота'
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_time',
    comment: 'Время окончания слота'
  },
  status: {
    type: DataTypes.ENUM('free', 'booked', 'blocked'),
    defaultValue: 'free',
    field: 'status',
    comment: 'Статус слота: free-свободен, booked-забронирован, blocked-заблокирован'
  },
  source: {
    type: DataTypes.ENUM('auto', 'manual'),
    defaultValue: 'auto',
    field: 'source',
    comment: 'Источник создания: auto-из расписания, manual-вручную'
  }
}, {
  tableName: 'slots',
  schema: 'booking_schema',
  indexes: [
    {
      fields: ['master_id', 'start_time'],
      name: 'idx_slots_master_datetime'
    },
    {
      fields: ['status'],
      name: 'idx_slots_status'
    },
    {
      fields: ['master_id', 'status'],
      name: 'idx_slots_master_status'
    }
  ],
  paranoid: false,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  hooks: {
    beforeValidate: (timeSlot) => {
      if (timeSlot.start_time && timeSlot.end_time) {
        const start = new Date(timeSlot.start_time);
        const end = new Date(timeSlot.end_time);

        if (start >= end) {
          throw new Error('Время окончания должно быть позже времени начала');
        }
      }
    }
  }
});


module.exports = TimeSlot;
