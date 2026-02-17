const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id' // Указывает, что поле в базе данных будет id
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chat_users', // Имя таблицы в базе данных для ChatUser
      key: 'id'
    },
    field: 'sender_id' // Указывает, что поле в базе данных будет sender_id
  },
  receiver_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'chat_users', // Имя таблицы в базе данных для ChatUser
      key: 'id'
    },
    field: 'receiver_id' // Указывает, что поле в базе данных будет receiver_id
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
    field: 'content' // Указывает, что поле в базе данных будет content
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
    field: 'message_type' // Указывает, что поле в базе данных будет message_type
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read' // Указывает, что поле в базе данных будет is_read
  },
  sent_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: {
        msg: 'Время отправки должно быть действительной датой'
      }
    },
    field: 'sent_at' // Указывает, что поле в базе данных будет sent_at
  }

}, {
  tableName: 'chat_messages', // Указываем имя таблицы явно
  indexes: [
    {
      fields: ['sender_id'], // индекс для поиска по отправителю
      name: 'messages_sender_id_index'
    },
    {
      fields: ['receiver_id'], // индекс для поиска по получателю
      name: 'messages_receiver_id_index'
    },
    {
      fields: ['sent_at'], // индекс для поиска по времени отправки
      name: 'messages_sent_at_index'
    },
    {
      fields: ['is_read'], // индекс для поиска по статусу прочтения
      name: 'messages_is_read_index'
    }
  ],
  paranoid: true, // Включаем мягкое удаление
  timestamps: true, // Включаем автоматические метки времени
  createdAt: 'created_at', // Имя поля для времени создания
  updatedAt: 'updated_at' // Имя поля для времени обновления
});

module.exports = Message;