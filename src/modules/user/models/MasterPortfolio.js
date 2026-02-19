const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const MasterPortfolio = sequelize.define('MasterPortfolio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
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
    onUpdate: 'CASCADE',
    comment: 'ID мастера'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [2, 255],
        msg: 'Название работы должно содержать от 2 до 255 символов'
      },
      notEmpty: {
        msg: 'Название работы не может быть пустым'
      }
    },
    field: 'title',
    comment: 'Название работы (например, "Вечерняя прическа", "Свадебный маникюр")'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Описание не должно превышать 1000 символов'
      }
    },
    field: 'description',
    comment: 'Описание работы, использованные техники и материалы'
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'image_url',
    validate: {
      notEmpty: {
        msg: 'URL изображения обязателен'
      },
      is: {
        args: /^(https?:\/\/|\/)/i,
        msg: 'Изображение должно быть действительным URL или относительным путем'
      }
    },
    comment: 'URL фотографии работы'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [2, 100],
        msg: 'Категория должна содержать от 2 до 100 символов'
      }
    },
    field: 'category',
    comment: 'Категория работы (например, "Прически", "Маникюр", "Педикюр")'
  },
  service_type: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [2, 255],
        msg: 'Тип услуги должен содержать от 2 до 255 символов'
      }
    },
    field: 'service_type',
    comment: 'Тип услуги, к которой относится работа'
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_featured',
    comment: 'Избранная работа (показывается в начале портфолио)'
  },
  is_visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_visible',
    comment: 'Видимость работы в профиле'
  },
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Количество лайков не может быть отрицательным'
      }
    },
    field: 'likes_count',
    comment: 'Количество лайков'
  },
  created_date: {
    type: DataTypes.DATEONLY,
    field: 'created_date',
    comment: 'Дата выполнения работы'
  }
}, {
  tableName: 'master_portfolio',
  schema: 'user_schema',
  indexes: [
    {
      fields: ['master_id'],
      name: 'master_portfolio_master_id_index'
    },
    {
      fields: ['category'],
      name: 'master_portfolio_category_index'
    },
    {
      fields: ['is_featured'],
      name: 'master_portfolio_is_featured_index'
    },
    {
      fields: ['is_visible'],
      name: 'master_portfolio_is_visible_index'
    },
    {
      fields: ['created_date'],
      name: 'master_portfolio_created_date_index'
    }
  ],
  paranoid: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  comment: 'Портфолио работ мастеров'
});

module.exports = MasterPortfolio;
