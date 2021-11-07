const { Model, DataTypes } = require('sequelize');

class Days extends Model{
  static init(sequelize){
    super.init({
      id:       { type: DataTypes.UUID, allowNull: false, primaryKey: true },

      day_name: { type: DataTypes.ENUM({ values: [ 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun' ]}), allowNull: false },

      status:   { type: DataTypes.BOOLEAN }
    },{
      sequelize,
      tableName:  'tbl_days',
      schema:     'availability',
      timestamps: false
    })
  }
}

module.exports = Days;