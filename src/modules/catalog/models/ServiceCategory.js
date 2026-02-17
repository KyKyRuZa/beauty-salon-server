const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');


const ServiceCategory = sequelize.define('ServiceCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Название категории услуги не может быть пустым'
      },
      len: {
        args: [2, 255],
        msg: 'Название категории услуги должно содержать от 2 до 255 символов'
      }
    },
    field: 'name'
  },
  description: {
    type: DataTypes.TEXT,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Описание категории услуги не должно превышать 1000 символов'
      }
    },
    field: 'description'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  is_popular: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_popular'
  }
}, {
  tableName: 'service_categories',
  schema: 'catalog_schema',
  indexes: [
    {
      fields: ['is_active'],
      name: 'category_is_active_index'
    },
    {
      fields: ['is_popular'],
      name: 'category_is_popular_index'
    }
  ],
  paranoid: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deletedAt'
});

module.exports = ServiceCategory;