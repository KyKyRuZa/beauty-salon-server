const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'client_id',
    comment: 'ID клиента (из таблицы clients)',
    references: {
      model: {
        schema: 'user_schema',
        tableName: 'clients'
      },
      key: 'id'
    }
  },
  master_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'master_id',
    comment: 'ID мастера (из таблицы masters)',
    references: {
      model: {
        schema: 'user_schema',
        tableName: 'masters'
      },
      key: 'id'
    }
  },
  master_service_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'master_service_id',
    comment: 'ID услуги мастера (из таблицы master_services)',
    references: {
      model: {
        schema: 'catalog_schema',
        tableName: 'master_services'
      },
      key: 'id'
    }
  },
  time_slot_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'time_slot_id',
    comment: 'ID временного слота (опционально, связывает со slots)',
    references: {
      model: {
        schema: 'booking_schema',
        tableName: 'slots'
      },
      key: 'id'
    }
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_time',
    comment: 'Время начала записи'
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_time',
    comment: 'Время окончания записи'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending',
    field: 'status',
    comment: 'Статус: pending-ожидает, confirmed-подтверждено, cancelled-отменено, completed-завершено'
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'comment',
    comment: 'Комментарий клиента к записи'
  },
  master_comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'master_comment',
    comment: 'Комментарий мастера к записи'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'price',
    comment: 'Цена услуги на момент записи'
  }
}, {
  tableName: 'booking',
  schema: 'booking_schema',
  indexes: [
    {
      fields: ['client_id'],
      name: 'booking_client_id_idx'
    },
    {
      fields: ['master_id'],
      name: 'booking_master_id_idx'
    },
    {
      fields: ['master_service_id'],
      name: 'booking_service_id_idx'
    },
    {
      fields: ['start_time'],
      name: 'booking_start_time_idx'
    },
    {
      fields: ['status'],
      name: 'booking_status_idx'
    },
    {
      fields: ['client_id', 'status'],
      name: 'booking_client_status_idx'
    },
    {
      fields: ['master_id', 'start_time'],
      name: 'booking_master_time_idx'
    }
  ],
  paranoid: true, // мягкое удаление
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  validate: {
    endTimeAfterStartTime() {
      if (this.start_time && this.end_time) {
        const start = new Date(this.start_time);
        const end = new Date(this.end_time);
        if (start >= end) {
          throw new Error('Время окончания должно быть позже времени начала');
        }
      }
    },
    validStatus() {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (this.status && !validStatuses.includes(this.status)) {
        throw new Error('Неверный статус бронирования');
      }
    }
  }
});

// Ассоциации будут определены в associations.js
module.exports = Booking;
