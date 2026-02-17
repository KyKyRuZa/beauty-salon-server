'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Изменяем поле service_id на variation_id в таблице booking
    await queryInterface.renameColumn('booking', 'service_id', 'variation_id');
    
    // Обновляем внешний ключ для variation_id
    await queryInterface.changeColumn('booking', 'variation_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'variation_id',
      references: {
        model: {
          schema: 'catalog_schema',
          tableName: 'service_variations'
        },
        key: 'id'
      }
    });

    // Изменяем поле service_id на variation_id в таблице orders
    await queryInterface.renameColumn('orders', 'service_id', 'variation_id');
    
    // Обновляем внешний ключ для variation_id
    await queryInterface.changeColumn('orders', 'variation_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'variation_id',
      references: {
        model: {
          schema: 'catalog_schema',
          tableName: 'service_variations'
        },
        key: 'id'
      }
    });

    // Обновляем индекс в таблице orders
    await queryInterface.removeIndex('orders', 'orders_service_id_index');
    await queryInterface.addIndex('orders', {
      fields: ['variation_id'],
      name: 'orders_variation_id_index'
    });
  },

  async down(queryInterface, Sequelize) {
    // Возвращаем изменения назад
    await queryInterface.renameColumn('booking', 'variation_id', 'service_id');
    
    await queryInterface.changeColumn('booking', 'service_id', {
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

    await queryInterface.renameColumn('orders', 'variation_id', 'service_id');
    
    await queryInterface.changeColumn('orders', 'service_id', {
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

    // Восстанавливаем старый индекс
    await queryInterface.removeIndex('orders', 'orders_variation_id_index');
    await queryInterface.addIndex('orders', {
      fields: ['service_id'],
      name: 'orders_service_id_index'
    });
  }
};