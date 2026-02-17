const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chat_users',
      key: 'id'
    },
    field: 'sender_id'
  },
  receiver_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'chat_users',
      key: 'id'
    },
    field: 'receiver_id'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Содержание сообщения не может быть пустым'
      },
      len: {
        args: [1, 5000],
        msg: 'Содержание сообщения не должно превышать 5000 символов'
      }
    },
    field: 'content'
  },
  message_type: {
    type: DataTypes.ENUM('text', 'image', 'file'),
    defaultValue: 'text',
    validate: {
      isIn: {
        args: [['text', 'image', 'file']],
        msg: 'Тип сообщения должен быть одним из: text, image, file'
      }
    },
    field: 'message_type'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  sent_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: {
        msg: 'Время отправки должно быть действительной датой'
      }
    },
    field: 'sent_at'
  }

}, {
  tableName: 'chat_messages',
  indexes: [
    {
      fields: ['sender_id'],
      name: 'messages_sender_id_index'
    },
    {
      fields: ['receiver_id'],
      name: 'messages_receiver_id_index'
    },
    {
      fields: ['sent_at'],
      name: 'messages_sent_at_index'
    },
    {
      fields: ['is_read'],
      name: 'messages_is_read_index'
    }
  ],
  paranoid: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Message;