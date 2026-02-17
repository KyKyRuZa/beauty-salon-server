const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Salon = sequelize.define('Salon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: {
        schema: 'user_schema',
        tableName: 'users'
      },
      key: 'id'
    },
    field: 'user_id' // Указывает, что поле в базе данных будет user_id
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Название салона не может быть пустым'
      },
      len: {
        args: [2, 255],
        msg: 'Название салона должно содержать от 2 до 255 символов'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Описание салона не должно превышать 1000 символов'
      }
    }
  },
  address: {
    type: DataTypes.STRING,
    validate: {
      len: {
        args: [0, 500],
        msg: 'Адрес не должен превышать 500 символов'
      }
    }
  },
  inn: {
    type: DataTypes.STRING,
    validate: {
      len: {
        args: [10, 12],
        msg: 'ИНН должен содержать 10 или 12 символов'
      },
      is: {
        args: /^\d{10}$|^\d{12}$/,
        msg: 'ИНН должен содержать только цифры'
      }
    }
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2), // average rating out of 5
    defaultValue: 0.00,
    validate: {
      min: {
        args: [0.00],
        msg: 'Рейтинг не может быть меньше 0'
      },
      max: {
        args: [5.00],
        msg: 'Рейтинг не может быть больше 5'
      }
    }
  },
  image_url: {
    type: DataTypes.STRING,
    field: 'image_url', // URL изображения салона
    validate: {
      is: {
        args: /^(https?:\/\/|\/)/i, // Проверяем, начинается ли строка с http://, https:// или /
        msg: 'Изображение должно быть действительным URL или относительным путем'
      }
    }
  }
}, {
  tableName: 'salons', // Указываем имя таблицы явно
  schema: 'user_schema', // Указываем схему для пользовательских данных
  indexes: [
    {
      unique: true,
      fields: ['user_id'], // индекс для уникальности user_id
      name: 'salons_user_id_unique'
    },
    {
      fields: ['name'], // индекс для поиска по названию
      name: 'salons_name_index'
    }
  ],
  paranoid: true, // Включаем мягкое удаление
  timestamps: true, // Включаем автоматические метки времени
  createdAt: 'created_at', // Имя поля для времени создания
  updatedAt: 'updated_at' // Имя поля для времени обновления
});

module.exports = Salon;