'use strict';

const tableName = 'tbl_availability';
const schema    = 'availability';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(tableName, {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },

      fk_mon_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
      fk_tue_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
      fk_wed_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
      fk_thu_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
      fk_fri_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
      fk_sat_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
      fk_sun_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }}
    },{
      schema,
      timestamps: false
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName, schema });
  }
};
