'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем поля first_name и last_name в таблицу admins
    await queryInterface.addColumn('admins', 'first_name', {
      type: Sequelize.STRING,
      allowNull: true, // временно разрешаем NULL, пока не заполним данными
      field: 'first_name'
    });

    await queryInterface.addColumn('admins', 'last_name', {
      type: Sequelize.STRING,
      allowNull: true, // временно разрешаем NULL, пока не заполним данными
      field: 'last_name'
    });
  },

  async down(queryInterface) {
    // Удаляем поля first_name и last_name из таблицы admins
    await queryInterface.removeColumn('admins', 'first_name');
    await queryInterface.removeColumn('admins', 'last_name');
  }
};