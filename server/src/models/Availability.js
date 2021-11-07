const { Model, DataTypes } = require('sequelize');

class Availability extends Model{
  static init(sequelize){
    super.init({
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },

      fk_mon_id: { type: DataTypes.UUID, allowNull: true, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
      fk_tue_id: { type: DataTypes.UUID, allowNull: true, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
      fk_wed_id: { type: DataTypes.UUID, allowNull: true, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
      fk_thu_id: { type: DataTypes.UUID, allowNull: true, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
      fk_fri_id: { type: DataTypes.UUID, allowNull: true, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
      fk_sat_id: { type: DataTypes.UUID, allowNull: true, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }},
      fk_sun_id: { type: DataTypes.UUID, allowNull: true, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }}
    },{
      sequelize,
      tableName:  'tbl_availability',
      schema:     'availability',
      timestamps: false
    })
  }

  static associate(Model){
    this.belongsTo(Model.Days, { foreignKey: "fk_mon_id" });
    this.belongsTo(Model.Days, { foreignKey: "fk_tue_id" });
    this.belongsTo(Model.Days, { foreignKey: "fk_wed_id" });
    this.belongsTo(Model.Days, { foreignKey: "fk_thu_id" });
    this.belongsTo(Model.Days, { foreignKey: "fk_fri_id" });
    this.belongsTo(Model.Days, { foreignKey: "fk_sat_id" });
    this.belongsTo(Model.Days, { foreignKey: "fk_sun_id" });
  }
}

module.exports = Availability;
