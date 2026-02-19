const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const MasterSkill = sequelize.define('MasterSkill', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
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
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    comment: 'ID мастера'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [2, 255],
        msg: 'Название навыка должно содержать от 2 до 255 символов'
      },
      notEmpty: {
        msg: 'Название навыка не может быть пустым'
      }
    },
    field: 'name',
    comment: 'Название навыка (например, "Укладка и причёски", "Маникюр с покрытием")'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
    validate: {
      min: {
        args: [0],
        msg: 'Порядок сортировки не может быть отрицательным'
      }
    },
    comment: 'Порядок отображения навыка (0 - по умолчанию)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Активен ли навык (отображается в профиле)'
  }
}, {
  tableName: 'master_skills',
  schema: 'user_schema',
  indexes: [
    {
      fields: ['master_id'],
      name: 'master_skills_master_id_index'
    },
    {
      fields: ['master_id', 'sort_order'],
      name: 'master_skills_sort_index'
    },
    {
      fields: ['is_active'],
      name: 'master_skills_is_active_index'
    }
  ],
  paranoid: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  comment: 'Навыки и специализации мастеров'
});

module.exports = MasterSkill;
