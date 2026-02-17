const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Client = sequelize.define('Client', {
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
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    validate: {
      isInt: true,
      min: 1
    }
  },
  first_name: {
    type: DataTypes.STRING,
    field: 'first_name', // Указывает, что поле в базе данных будет first_name
    validate: {
      notEmpty: {
        msg: 'Имя не может быть пустым'
      },
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
      notEmpty: {
        msg: 'Фамилия не может быть пустой'
      },
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
  image_url: {
    type: DataTypes.STRING,
    field: 'image_url', // URL изображения клиента
    validate: {
      is: {
        args: /^(https?:\/\/|\/)/i, // Проверяем, начинается ли строка с http://, https:// или /
        msg: 'Изображение должно быть действительным URL или относительным путем'
      }
    }
  }
}, {
  tableName: 'clients', // Указываем имя таблицы явно
  schema: 'user_schema', // Указываем схему для пользовательских данных
  indexes: [
    {
      unique: true,
      fields: ['user_id'], // индекс для уникальности user_id
      name: 'clients_user_id_unique'
    },
    {
      fields: ['last_name'], // индекс для поиска по фамилии
      name: 'clients_last_name_index'
    }
  ],
  paranoid: true, // Включаем мягкое удаление
  timestamps: true, // Включаем автоматические метки времени
  createdAt: 'created_at', // Имя поля для времени создания
  updatedAt: 'updated_at', // Имя поля для времени обновления
  getterMethods: {
    firstName() {
      return this.getDataValue('first_name');
    },
    lastName() {
      return this.getDataValue('last_name');
    }
  },
  setterMethods: {
    firstName(value) {
      this.setDataValue('first_name', value);
    },
    lastName(value) {
      this.setDataValue('last_name', value);
    }
  }
});

module.exports = Client;