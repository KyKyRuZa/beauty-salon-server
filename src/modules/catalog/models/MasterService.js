const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');
const Master = require('../../user/models/Master');
const Salon = require('../../user/models/Salon');
const ServiceCategory = require('./ServiceCategory');


const MasterService = sequelize.define('MasterService', {
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
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'category_id',
    references: {
      model: {
        schema: 'catalog_schema',
        tableName: 'service_categories'
      },
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Название услуги не может быть пустым'
      },
      len: {
        args: [2, 255],
        msg: 'Название услуги должно содержать от 2 до 255 символов'
      }
    },
    field: 'name'
  },
  description: {
    type: DataTypes.TEXT,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Описание услуги не должно превышать 1000 символов'
      }
    },
    field: 'description'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Цена не может быть отрицательной'
      },
      max: {
        args: [999999.99],
        msg: 'Цена не может превышать 999999.99'
      }
    },
    field: 'price'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'master_services',
  schema: 'catalog_schema',
  indexes: [
    {
      fields: ['master_id'],
      name: 'master_service_master_id_index'
    },
    {
      fields: ['salon_id'],
      name: 'master_service_salon_id_index'
    },
    {
      fields: ['category_id'],
      name: 'master_service_category_id_index'
    },
    {
      fields: ['name'],
      name: 'master_service_name_index'
    },
    {
      fields: ['is_active'],
      name: 'master_service_is_active_index'
    }
  ],
  paranoid: false,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});


MasterService.belongsTo(Master, {
  foreignKey: 'master_id',
  targetKey: 'id',
  as: 'master'
});

MasterService.belongsTo(Salon, {
  foreignKey: 'salon_id',
  targetKey: 'id',
  as: 'salon'
});

MasterService.belongsTo(ServiceCategory, {
  foreignKey: 'category_id',
  targetKey: 'id',
  as: 'category'
});

module.exports = MasterService;