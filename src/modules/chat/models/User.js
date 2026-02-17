const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const User = sequelize.define('ChatUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Имя пользователя не может быть пустым'
      },
      len: {
        args: [3, 50],
        msg: 'Имя пользователя должно содержать от 3 до 50 символов'
      },
      isAlphanumeric: {
        msg: 'Имя пользователя может содержать только буквы и цифры'
      }
    },
    field: 'username'
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

          if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            throw new Error('Пароль должен содержать хотя бы одну заглавную букву, строчную букву и цифру');
          }
        }
      }
    },
    field: 'password'
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: {
        msg: 'Пожалуйста, введите действительный адрес электронной почты'
      },
      len: {
        args: [0, 255],
        msg: 'Адрес электронной почты не должен превышать 255 символов'
      }
    },
    field: 'email'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'chat_users',
  indexes: [
    {
      unique: true,
      fields: ['username'],
      name: 'chat_users_username_unique'
    },
    {
      unique: true,
      fields: ['email'],
      name: 'chat_users_email_unique'
    }
  ],
  validate: {
    validEmail() {
      if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
        throw new Error('Пожалуйста, введите действительный адрес электронной почты');
      }
    }
  },
  paranoid: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;