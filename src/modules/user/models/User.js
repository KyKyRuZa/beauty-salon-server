const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: {
        args: /^\+?[\d\s\-()]{10,}$/,
        msg: 'Номер телефона должен содержать не менее 10 символов и может включать цифры, пробелы, дефисы и скобки'
      }
    },
    field: 'phone' // Указывает, что поле в базе данных будет phone
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Пожалуйста, введите действительный адрес электронной почты'
      },
      notEmpty: {
        msg: 'Адрес электронной почты не может быть пустым'
      },
      len: {
        args: [5, 255],
        msg: 'Адрес электронной почты должен содержать от 5 до 255 символов'
      }
    },
    field: 'email' // Указывает, что поле в базе данных будет email
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Пароль не может быть пустым'
      },
      len: {
        args: [6, 128],
        msg: 'Пароль должен содержать от 6 до 128 символов'
      },
      isStrongPassword(value) {
        if (value && typeof value === 'string') {
          // Проверяем, содержит ли пароль хотя бы одну заглавную букву, строчную букву и цифру
          if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            throw new Error('Пароль должен содержать хотя бы одну заглавную букву, строчную букву и цифру');
          }
        }
      }
    },
    field: 'password' // Указывает, что поле в базе данных будет password
  },
  role: {
    type: DataTypes.ENUM('client', 'master', 'salon', 'admin'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['client', 'master', 'salon', 'admin']],
        msg: 'Роль должна быть одной из: client, master, salon, admin'
      }
    },
    field: 'role' // Указывает, что поле в базе данных будет role
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active' // Указывает, что поле в базе данных будет is_active
  }
}, {
  tableName: 'users', // Указываем имя таблицы явно
  schema: 'user_schema', // Указываем схему для пользовательских данных
  indexes: [
    {
      unique: true,
      fields: ['email'], // индекс для уникальности email
      name: 'users_email_unique'
    },
    {
      unique: true,
      fields: ['phone'], // индекс для уникальности phone
      name: 'users_phone_unique'
    },
    {
      fields: ['role'], // индекс для поиска по роли
      name: 'users_role_index'
    }
  ],
  validate: {
    validEmail() {
      if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
        throw new Error('Пожалуйста, введите действительный адрес электронной почты');
      }
    }
  },
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    }
  },
  paranoid: true, // Включаем мягкое удаление
  timestamps: true, // Включаем автоматические метки времени
  createdAt: 'created_at', // Имя поля для времени создания
  updatedAt: 'updated_at' // Имя поля для времени обновления
});

module.exports = User;