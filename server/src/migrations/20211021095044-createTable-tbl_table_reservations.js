'use strict';

const tableName = 'tbl_table_reservations';
const schema    = 'register';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(tableName, {
      id:                   { type: Sequelize.UUID, allowNull: false, primaryKey: true },

      reservation_start_in: { type: Sequelize.DATE, allowNull: false },
      reservation_end_in:   { type: Sequelize.DATE, allowNull: false },

      how_many_people:      { type: Sequelize.INTEGER, allowNull: false },
      is_party:             { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },

      fk_users:             { type: Sequelize.UUID, allowNull: false, references: { schema: "register", model: "tbl_users",  key: "id" }},
      fk_tables:            { type: Sequelize.UUID, allowNull: false, references: { schema: "register", model: "tbl_tables", key: "id" }},
      
      status:               { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: true },
      cancel_reason:        { type: Sequelize.STRING,  allowNull: true },
      
      createdAt:            { type: Sequelize.DATE, defaultValue: new Date() },
      updatedAt:            { type: Sequelize.DATE, defaultValue: new Date() }
    },{
      schema
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName, schema });
  }
};
