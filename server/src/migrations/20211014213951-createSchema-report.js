'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createSchema('report');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropSchema('report');
  }
};
