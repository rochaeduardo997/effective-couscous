'use strict';

const tableName = 'tbl_tables';
const schema    = 'register';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(tableName, {
      id:                 { type: Sequelize.UUID, allowNull: false, primaryKey: true },

      table_number:       { type: Sequelize.INTEGER, allowNull: false },

      status:             { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

      fk_table_locations: { type: Sequelize.UUID, allowNull: true, references: { schema: "register", model: "tbl_table_locations", key: "id" }},

      createdAt:          { type: Sequelize.DATE, defaultValue: new Date() },
      updatedAt:          { type: Sequelize.DATE, defaultValue: new Date() }
    },{
      schema
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName, schema });
  }
};
