const { Model, DataTypes } = require('sequelize');

class Ranges extends Model{
  static init(sequelize){
    super.init({
      id:       { type: DataTypes.UUID, allowNull: false, primaryKey: true },

      start_in: { type: DataTypes.INTEGER, allowNull: true, defaultValue: [ 1 ]},
      end_in:   { type: DataTypes.INTEGER, allowNull: true, defaultValue: [ 864e2 ]}, //86_400 segundos

      fk_days:  { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'tbl_days', schema: 'availability' }, key: 'id' }}
    },{
      sequelize,
      tableName:  'tbl_ranges',
      schema:     'availability',
      timestamps: false
    })
  }
  
  static associate(Model){
    this.belongsTo(Model.Days, { foreignKey: "fk_days", onDelete: 'cascade' });
  }
}

module.exports = Ranges;
