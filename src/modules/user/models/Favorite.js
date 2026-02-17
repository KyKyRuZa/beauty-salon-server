const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');
const User = require('../../user/models/User');
const Master = require('../../user/models/Master');

const Favorite = sequelize.define('Favorite', {
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
    field: 'user_id',
    references: {
      model: {
        schema: 'user_schema',
        tableName: 'users'
      },
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID клиента (пользователя)'
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
    comment: 'ID избранного мастера'
  }
}, {
  tableName: 'favorites',
  schema: 'user_schema',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'master_id'],
      name: 'favorites_user_master_unique'
    },
    {
      fields: ['user_id'],
      name: 'favorites_user_id_index'
    },
    {
      fields: ['master_id'],
      name: 'favorites_master_id_index'
    }
  ],
  paranoid: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  validate: {
    userIsClient() {

    }
  }
});


module.exports = Favorite;
