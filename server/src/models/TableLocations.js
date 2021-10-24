const { Model, DataTypes } = require('sequelize');

class TableLocations extends Model{
  static init(sequelize){
    super.init({
      id:         { type: DataTypes.UUID, primaryKey: true },

      location:   { type: DataTypes.STRING },

      createdAt:  { type: DataTypes.DATE },
      updatedAt:  { type: DataTypes.DATE }
    },{
      sequelize,
      tableName: 'tbl_table_locations',
      schema:    'register'
    })
  }
}

module.exports = TableLocations;
