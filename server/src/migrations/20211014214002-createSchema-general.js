'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createSchema('general');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropSchema('general');
  }
};
