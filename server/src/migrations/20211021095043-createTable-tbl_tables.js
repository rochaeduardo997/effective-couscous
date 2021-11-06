'use strict';

const tableName = 'tbl_tables';
const schema    = 'register';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(tableName, {
      id:                 { type: Sequelize.UUID, allowNull: false, primaryKey: true },

      table_number:       { type: Sequelize.INTEGER, allowNull: false },

      status:             { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

      fk_table_locations: { type: Sequelize.UUID, allowNull: true,  references: { model: { tableName: 'tbl_table_locations', schema: 'register' },     key: 'id' }},
      fk_availability:    { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'tbl_availability',    schema: 'availability' }, key: 'id' }},

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
