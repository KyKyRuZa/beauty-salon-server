const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Master = sequelize.define('Master', {
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
    field: 'user_id',
    references: {
      model: {
        schema: 'user_schema',
        tableName: 'users'
      },
      key: 'id'
    }
  },
  first_name: {
    type: DataTypes.STRING,
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
    },
    field: 'first_name'
  },
  last_name: {
    type: DataTypes.STRING,
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
    },
    field: 'last_name'
  },
  specialization: {
    type: DataTypes.STRING,
    validate: {
      len: {
        args: [2, 255],
        msg: 'Специализация должна содержать от 2 до 255 символов'
      }
    }
  },
  experience: {
    type: DataTypes.INTEGER,
    validate: {
      min: {
        args: [0],
        msg: 'Опыт не может быть отрицательным'
      },
      max: {
        args: [50],
        msg: 'Опыт не может превышать 50 лет'
      }
    }
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
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
  salon_id: {
    type: DataTypes.INTEGER,
    references: {
      model: {
        schema: 'user_schema',
        tableName: 'salons'
      },
      key: 'id'
    },
    field: 'salon_id'
  },
  bio: {
    type: DataTypes.TEXT
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_available'
  },
  image_url: {
    type: DataTypes.STRING,
    field: 'image_url',
    validate: {
      is: {
        args: /^(https?:\/\/|\/)/i,
        msg: 'Изображение должно быть действительным URL или относительным путем'
      }
    }
  }
}, {
  tableName: 'masters',
  schema: 'user_schema',
  indexes: [
    {
      unique: true,
      fields: ['user_id'],
      name: 'masters_user_id_unique'
    },
    {
      fields: ['specialization'],
      name: 'masters_specialization_index'
    }
  ],
  paranoid: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
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

module.exports = Master;