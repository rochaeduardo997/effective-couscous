'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createSchema('availability');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropSchema('availability');
  }
};
