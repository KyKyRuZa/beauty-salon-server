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
    allowNull: false,
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
    field: 'first_name',
    comment: 'Имя мастера'
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
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
    field: 'last_name',
    comment: 'Фамилия мастера'
  },
  
  
  specialization: {
    type: DataTypes.STRING,
    validate: {
      len: {
        args: [2, 255],
        msg: 'Специализация должна содержать от 2 до 255 символов'
      }
    },
    field: 'specialization',
    comment: 'Основная специализация'
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
    },
    field: 'experience',
    comment: 'Опыт работы в годах'
  },
  
  
  address: {
    type: DataTypes.STRING,
    validate: {
      len: {
        args: [0, 500],
        msg: 'Адрес не должен превышать 500 символов'
      }
    },
    field: 'address',
    comment: 'Адрес приема (город, улица, дом)'
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
    field: 'salon_id',
    comment: 'ID салона, если работает в салоне'
  },
  
  
  has_training: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'has_training',
    comment: 'Проводит ли обучение (true/false)'
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
    },
    field: 'rating',
    comment: 'Средний рейтинг (1-5)'
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_available',
    comment: 'Доступен для записи'
  },
  
  
  image_url: {
    type: DataTypes.STRING,
    field: 'image_url',
    validate: {
      is: {
        args: /^(https?:\/\/|\/)/i,
        msg: 'Изображение должно быть действительным URL или относительным путем'
      }
    },
    comment: 'URL фото профиля'
  },
  
  
  bio: {
    type: DataTypes.TEXT,
    field: 'bio',
    comment: 'О себе, достижения, информация'
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
    },
    {
      fields: ['salon_id'],
      name: 'masters_salon_id_index'
    },
    {
      fields: ['rating'],
      name: 'masters_rating_index'
    },
    {
      fields: ['has_training'],
      name: 'masters_has_training_index'
    }
  ],
  paranoid: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  comment: 'Профили мастеров-исполнителей',
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
