'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли поле name в таблице master_services
    const tableDescription = await queryInterface.describeTable('master_services');
    
    if (!tableDescription.name) {
      // Добавляем поле name в таблицу master_services
      await queryInterface.addColumn('master_services', 'name', {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'name',
        comment: 'Название услуги мастера'
      });
      
      // Также добавляем поле description, если его нет
      if (!tableDescription.description) {
        await queryInterface.addColumn('master_services', 'description', {
          type: Sequelize.TEXT,
          allowNull: true,
          field: 'description',
          comment: 'Описание услуги мастера'
        });
      }
      
      // Также добавляем поле price, если его нет
      if (!tableDescription.price) {
        await queryInterface.addColumn('master_services', 'price', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          field: 'price',
          comment: 'Цена услуги мастера'
        });
      }
      
      // Также добавляем поле duration_minutes, если его нет
      if (!tableDescription.duration_minutes) {
        await queryInterface.addColumn('master_services', 'duration_minutes', {
          type: Sequelize.INTEGER,
          allowNull: true,
          field: 'duration_minutes',
          comment: 'Длительность услуги в минутах'
        });
      }
      
      console.log('Поля успешно добавлены в таблицу master_services');
    } else {
      console.log('Поле name уже существует в таблице master_services');
    }
  },

  async down(queryInterface) {
    // Удаляем все добавленные поля
    await queryInterface.removeColumn('master_services', 'name');
    await queryInterface.removeColumn('master_services', 'description');
    await queryInterface.removeColumn('master_services', 'price');
    await queryInterface.removeColumn('master_services', 'duration_minutes');
    
    console.log('Поля успешно удалены из таблицы master_services');
  }
};