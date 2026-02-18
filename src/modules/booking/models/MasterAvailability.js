const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');
const MasterService = require('../../catalog/models/MasterService');

const MasterAvailability = sequelize.define('MasterAvailability', {
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
  service_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'service_id',
    comment: 'ID услуги',
    references: {
      model: {
        schema: 'catalog_schema',
        tableName: 'master_services'
      },
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'date',
    comment: 'Дата доступности'
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'start_time',
    comment: 'Время начала работы (например, 09:00:00)'
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'end_time',
    comment: 'Время окончания работы (например, 18:00:00)'
  },
  slot_duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 60,
    field: 'slot_duration',
    comment: 'Длительность одного слота в минутах (по умолчанию 60)'
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_available',
    comment: 'Доступен ли мастер в этот день'
  }
}, {
  tableName: 'master_availability',
  schema: 'booking_schema',
  indexes: [
    {
      fields: ['master_id', 'date'],
      name: 'idx_availability_master_date'
    },
    {
      fields: ['master_id', 'service_id', 'date'],
      name: 'idx_availability_master_service_date'
    },
    {
      fields: ['is_available'],
      name: 'idx_availability_status'
    }
  ],
  paranoid: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  hooks: {
    beforeValidate: (availability) => {
      if (availability.start_time && availability.end_time) {

        if (availability.start_time >= availability.end_time) {
          throw new Error('Время окончания должно быть позже времени начала');
        }
      }
    }
  }
});

MasterAvailability.belongsTo(MasterService, {
  foreignKey: 'service_id',
  targetKey: 'id',
  as: 'service'
});

module.exports = MasterAvailability;
