const { Model, DataTypes } = require('sequelize');

class Tables extends Model{
  static init(sequelize){
    super.init({
      id:                 { type: DataTypes.UUID, primaryKey: true },

      table_number:       { type: DataTypes.INTEGER },

      status:             { type: DataTypes.BOOLEAN },

      fk_table_locations: { type: DataTypes.UUID, allowNull: true,  references: { model: { tableName: 'tbl_table_locations', schema: 'register' },     key: 'id' }},
      fk_availability:    { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'tbl_availability',    schema: 'availability' }, key: 'id' }},

      createdAt:          { type: DataTypes.DATE },
      updatedAt:          { type: DataTypes.DATE }
    },{
      sequelize,
      tableName: 'tbl_tables',
      schema:    'register'
    })
  }

  static associate(Model){
    this.belongsTo(Model.TableLocations, { foreignKey: "fk_table_locations" });
    this.belongsTo(Model.Availability,   { foreignKey: "fk_availability" });
  }
}

module.exports = Tables;
