const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');
const ServiceCategory = require('./ServiceCategory');

const ServiceSubcategory = sequelize.define('ServiceSubcategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category_id',
    references: {
      model: {
        schema: 'catalog_schema',
        tableName: 'service_categories'
      },
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Название подкатегории услуги не может быть пустым'
      },
      len: {
        args: [2, 255],
        msg: 'Название подкатегории услуги должно содержать от 2 до 255 символов'
      }
    },
    field: 'name'
  },
  description: {
    type: DataTypes.TEXT,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Описание подкатегории услуги не должно превышать 1000 символов'
      }
    },
    field: 'description'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'service_subcategories', // Таблица для подкатегорий услуг
  schema: 'catalog_schema', // Указываем схему для каталога услуг
  indexes: [
    {
      fields: ['category_id'],
      name: 'subcategory_category_id_index'
    },
    {
      fields: ['is_active'],
      name: 'subcategory_is_active_index'
    }
  ],
  paranoid: true, // Включаем мягкое удаление
  timestamps: true, // Включаем автоматические метки времени
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deletedAt' // Указываем имя поля для мягкого удаления
});

// Определяем отношения
ServiceSubcategory.belongsTo(ServiceCategory, {
  foreignKey: 'category_id',
  targetKey: 'id',
  as: 'category'
});

module.exports = ServiceSubcategory;