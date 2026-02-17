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
    field: 'first_name',
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
    field: 'last_name',
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
    field: 'image_url',
    validate: {
      is: {
        args: /^(https?:\/\/|\/)/i,
        msg: 'Изображение должно быть действительным URL или относительным путем'
      }
    }
  }
}, {
  tableName: 'clients',
  schema: 'user_schema',
  indexes: [
    {
      unique: true,
      fields: ['user_id'],
      name: 'clients_user_id_unique'
    },
    {
      fields: ['last_name'],
      name: 'clients_last_name_index'
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

module.exports = Client;