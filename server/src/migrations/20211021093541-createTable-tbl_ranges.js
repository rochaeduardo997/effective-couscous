'use strict';

const tableName = 'tbl_ranges';
const schema    = 'availability';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(tableName, {
      id:       { type: Sequelize.UUID, allowNull: false, primaryKey: true },

      start_in: { type: Sequelize.INTEGER, allowNull: true, defaultValue: [ 1 ]},
      end_in:   { type: Sequelize.INTEGER, allowNull: true, defaultValue: [ 864e2 ]}, //86_400 segundos

      fk_days:  { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
    },{
      schema,
      timestamps: false
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName, schema });
  }
};
