'use strict';

const tableName = 'tbl_users';
const schema    = 'register';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(tableName, {
      id:         { type: Sequelize.UUID,    allowNull: false, primaryKey: true },

      first_name: { type: Sequelize.STRING,  allowNull: false },
      surname:    { type: Sequelize.STRING,  allowNull: false },
      username:   { type: Sequelize.STRING,  allowNull: false, unique: true },

      contact:    { type: Sequelize.STRING,  allowNull: false },
      email:      { type: Sequelize.STRING,  allowNull: false, unique: true },
      
      password:   { type: Sequelize.STRING,  allowNull: false },

      profile:    { type: Sequelize.ENUM({ values: [ 'creator', 'administrator', 'supervisor', 'dashboard', 'bartender', 'client' ]}), allowNull: false, defaultValue: 'client' },

      active:     { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

      createdAt:  { type: Sequelize.DATE, defaultValue: new Date() },
      updatedAt:  { type: Sequelize.DATE, defaultValue: new Date() }
    },{
      schema
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName, schema });
  }
};
