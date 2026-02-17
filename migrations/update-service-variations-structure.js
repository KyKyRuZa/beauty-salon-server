'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем новые поля в таблицу service_variations
    await queryInterface.addColumn('service_variations', 'name', {
      type: Sequelize.STRING,
      allowNull: false,
      field: 'name'
    });

    await queryInterface.addColumn('service_variations', 'description', {
      type: Sequelize.TEXT,
      field: 'description'
    });

    await queryInterface.addColumn('service_variations', 'time_slot_start', {
      type: Sequelize.TIME,
      allowNull: false,
      field: 'time_slot_start'
    });

    await queryInterface.addColumn('service_variations', 'time_slot_end', {
      type: Sequelize.TIME,
      allowNull: false,
      field: 'time_slot_end'
    });

    await queryInterface.addColumn('service_variations', 'duration_minutes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'duration_minutes'
    });

    await queryInterface.addColumn('service_variations', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      field: 'price'
    });

    await queryInterface.addColumn('service_variations', 'category', {
      type: Sequelize.STRING,
      field: 'category'
    });

    await queryInterface.addColumn('service_variations', 'catalog_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'catalog_id',
      references: {
        model: {
          schema: 'catalog_schema',
          tableName: 'services_catalog'
        },
        key: 'id'
      }
    });

    await queryInterface.addColumn('service_variations', 'is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    });

    await queryInterface.addColumn('service_variations', 'is_popular', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      field: 'is_popular'
    });

    await queryInterface.addColumn('service_variations', 'rating', {
      type: Sequelize.DECIMAL(3, 2),
      field: 'rating'
    });

    await queryInterface.addColumn('service_variations', 'popularity_score', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      field: 'popularity_score'
    });

    await queryInterface.addColumn('service_variations', 'image_url', {
      type: Sequelize.STRING,
      field: 'image_url'
    });

    // Удаляем старое поле service_id
    await queryInterface.removeColumn('service_variations', 'service_id');

    // Обновляем индексы
    await queryInterface.addIndex('service_variations', {
      fields: ['catalog_id'],
      name: 'variation_catalog_id_index'
    });

    await queryInterface.addIndex('service_variations', {
      fields: ['time_slot_start'],
      name: 'variation_time_slot_start_index'
    });

    await queryInterface.addIndex('service_variations', {
      fields: ['time_slot_end'],
      name: 'variation_time_slot_end_index'
    });
  },

  async down(queryInterface, Sequelize) {
    // Удаляем добавленные поля
    await queryInterface.removeColumn('service_variations', 'name');
    await queryInterface.removeColumn('service_variations', 'description');
    await queryInterface.removeColumn('service_variations', 'time_slot_start');
    await queryInterface.removeColumn('service_variations', 'time_slot_end');
    await queryInterface.removeColumn('service_variations', 'duration_minutes');
    await queryInterface.removeColumn('service_variations', 'price');
    await queryInterface.removeColumn('service_variations', 'category');
    await queryInterface.removeColumn('service_variations', 'catalog_id');
    await queryInterface.removeColumn('service_variations', 'is_active');
    await queryInterface.removeColumn('service_variations', 'is_popular');
    await queryInterface.removeColumn('service_variations', 'rating');
    await queryInterface.removeColumn('service_variations', 'popularity_score');
    await queryInterface.removeColumn('service_variations', 'image_url');

    // Восстанавливаем старое поле service_id
    await queryInterface.addColumn('service_variations', 'service_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'service_id',
      references: {
        model: {
          schema: 'catalog_schema',
          tableName: 'services'
        },
        key: 'id'
      }
    });

    // Удаляем добавленные индексы
    await queryInterface.removeIndex('service_variations', 'variation_catalog_id_index');
    await queryInterface.removeIndex('service_variations', 'variation_time_slot_start_index');
    await queryInterface.removeIndex('service_variations', 'variation_time_slot_end_index');
  }
};