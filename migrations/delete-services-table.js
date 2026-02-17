'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Удаляем таблицу services
    await queryInterface.dropTable('services');
  },

  async down(queryInterface, Sequelize) {
    // Восстанавливаем таблицу services
    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'name'
      },
      description: {
        type: Sequelize.TEXT,
        field: 'description'
      },
      duration: {
        type: Sequelize.INTEGER, // продолжительность в минутах
        field: 'duration'
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        field: 'price'
      },
      category: {
        type: Sequelize.STRING,
        field: 'category'
      },
      catalog_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'catalog_id'
      },
      master_id: {
        type: Sequelize.INTEGER,
        field: 'master_id'
      },
      salon_id: {
        type: Sequelize.INTEGER,
        field: 'salon_id'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        field: 'rating'
      },
      popularity_score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        field: 'popularity_score'
      },
      created_at: {
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updated_at: {
        type: Sequelize.DATE,
        field: 'updated_at'
      },
      deletedAt: {
        type: Sequelize.DATE,
        field: 'deletedAt'
      }
    }, {
      schema: 'catalog_schema'
    });
  }
};