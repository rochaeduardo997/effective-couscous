const { DataTypes, Model } = require('sequelize');

class TableReservations extends Model{
  static init(sequelize){
    super.init({
      id:                   { type: DataTypes.UUID, primaryKey: true },

      reservation_start_in: { type: DataTypes.STRING },
      reservation_end_in:   { type: DataTypes.STRING },

      how_many_people:      { type: DataTypes.INTEGER },
      is_party:             { type: DataTypes.BOOLEAN },

      status:               { type: DataTypes.BOOLEAN },
      cancel_reason:        { type: DataTypes.STRING },

      fk_users:             { type: DataTypes.UUID },
      fk_tables:            { type: DataTypes.UUID },
    },{
      sequelize,
      tableName: 'tbl_table_reservations',
      schema:    'register'
    });
  }

  static associate(Model){
    this.belongsTo(Model.Tables, { foreignKey: "fk_tables" });
    this.belongsTo(Model.Users,  { foreignKey: "fk_users" });
  }
}

module.exports = TableReservations;