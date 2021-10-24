'use strict';

const tableName = 'tbl_table_locations';
const schema    = 'register';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(tableName, {
      id:        { type: Sequelize.UUID, allowNull: false, primaryKey: true },

      location:  { type: Sequelize.STRING, allowNull: false },
      
      createdAt: { type: Sequelize.DATE, defaultValue: new Date() },
      updatedAt: { type: Sequelize.DATE, defaultValue: new Date() }
    },{
      schema
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName, schema });
  }
};
