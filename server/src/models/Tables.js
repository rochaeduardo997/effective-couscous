const { Model, DataTypes } = require('sequelize');

class Tables extends Model{
  static init(sequelize){
    super.init({
      id:                 { type: DataTypes.UUID, primaryKey: true },

      table_number:       { type: DataTypes.INTEGER },

      status:             { type: DataTypes.BOOLEAN },

      fk_table_locations: { type: DataTypes.UUID, allowNull: true, references: { schema: 'register', model: 'tbl_table_locations', key: 'id' }},

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
  }
}

module.exports = Tables;
