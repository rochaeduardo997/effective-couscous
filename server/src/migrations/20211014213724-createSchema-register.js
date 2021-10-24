'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createSchema('register');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropSchema('register');
  }
};
