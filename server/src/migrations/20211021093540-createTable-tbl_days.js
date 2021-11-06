'use strict';

const tableName = 'tbl_days';
const schema    = 'availability';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(tableName, {
      id:       { type: Sequelize.UUID, allowNull: false, primaryKey: true },

      day_name: { type: Sequelize.ENUM({ values: [ 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun' ]}), allowNull: false },

      status:   { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: true }
    },{
      schema,
      timestamps: false
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName, schema });
  }
};
