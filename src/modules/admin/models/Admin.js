const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

// Модель для администраторов
const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
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
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'admin',
    validate: {
      isIn: {
        args: [['admin', 'super_admin', 'moderator']],
        msg: 'Role must be admin, super_admin, or moderator'
      }
    },
    field: 'role'
  },
  permissions: {
    type: DataTypes.JSONB, // JSONB для хранения разрешений
    allowNull: true,
    field: 'permissions'
  },
  first_name: {
    type: DataTypes.STRING,
    field: 'first_name', // Указывает, что поле в базе данных будет first_name
    validate: {
      len: {
        args: [2, 100],
        msg: 'Имя должно содержать от 2 до 100 символов'
      },
      isAlphaWithCyrillic(value) {
        if (value && !/^[A-Za-zА-Яа-яЁё\s\-']+$/i.test(value)) {
          throw new Error('Имя должно содержать только буквы, пробелы, дефисы и апострофы');
        }
      }
    }
  },
  last_name: {
    type: DataTypes.STRING,
    field: 'last_name', // Указывает, что поле в базе данных будет last_name
    validate: {
      len: {
        args: [2, 100],
        msg: 'Фамилия должна содержать от 2 до 100 символов'
      },
      isAlphaWithCyrillic(value) {
        if (value && !/^[A-Za-zА-Яа-яЁё\s\-']+$/i.test(value)) {
          throw new Error('Фамилия должна содержать только буквы, пробелы, дефисы и апострофы');
        }
      }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'admins', // Таблица для администраторов
  schema: 'user_schema', // Используем ту же схему, что и для других пользователей
  indexes: [
    {
      fields: ['user_id'],
      name: 'admin_user_id_index'
    },
    {
      fields: ['role'],
      name: 'admin_role_index'
    },
    {
      fields: ['is_active'],
      name: 'admin_is_active_index'
    }
  ],
  paranoid: true, // Включаем мягкое удаление
  timestamps: true, // Включаем автоматические метки времени
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deletedAt' // Указываем имя поля для мягкого удаления
});

// Определяем отношения
Admin.associate = function(models) {
  Admin.belongsTo(models.User, {
    foreignKey: 'user_id',
    targetKey: 'id',
    as: 'user'
  });
};

module.exports = Admin;