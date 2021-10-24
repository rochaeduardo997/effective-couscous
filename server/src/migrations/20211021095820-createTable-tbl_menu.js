'use strict';

const tableName = 'tbl_menu';
const schema    = 'register';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(tableName, {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    },{
      schema
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName, schema });
  }
};
