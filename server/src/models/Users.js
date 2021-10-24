const { Model, DataTypes } = require('sequelize');

class Users extends Model{
  static init(sequelize){
    super.init({
      id:         { type: DataTypes.UUID, primaryKey: true },

      first_name: { type: DataTypes.STRING },
      surname:    { type: DataTypes.STRING },
      username:   { type: DataTypes.STRING },

      contact:    { type: DataTypes.STRING },
      email:      { type: DataTypes.STRING },
      
      password:   { type: DataTypes.STRING },

      profile:    { type: DataTypes.ENUM({ values: [ 'creator', 'administrator', 'supervisor', 'dashboard', 'bartender', 'client' ]}) },

      active:     { type: DataTypes.BOOLEAN },

      createdAt:  { type: DataTypes.DATE },
      updatedAt:  { type: DataTypes.DATE }
    },{
      sequelize,
      tableName: 'tbl_users',
      schema:    'register'
    })
  }
}

module.exports = Users;
