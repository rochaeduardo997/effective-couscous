const Joi            = require('joi');
const { v4: uuidv4 } = require('uuid');

const adminAuth       = require('../../middleware/adminAuth');
const basicAuth       = require('../../middleware/basicAuth');

module.exports = (app) => {
  const printLogTitle = 'Tables';

  const tableRegisterValidation = Joi.object({
    id:                 Joi.string().required().guid({ version: [ 'uuidv4' ]}),

    table_number:       Joi.number().min(0).required(),

    status:             Joi.boolean(),

    fk_table_locations: Joi.string().guid({ version: [ 'uuidv4' ]})
  });
  const tableUpdateValidation = Joi.object({
    id:                 Joi.string().guid({ version: [ 'uuidv4' ]}),

    table_number:       Joi.number().min(0),

    status:             Joi.boolean(),

    fk_table_locations: Joi.string().guid({ version: [ 'uuidv4' ]})
  });

  async function index(req, res){
    try{
      const result = await app.Tables.findAll({ 
        include:[
          { model: app.TableLocations }
        ],
        attributes:{ exclude: [ 'fk_table_locations', 'fk_users' ] }
      });

      app.utils.printLog(printLogTitle, 'Route: Index', `Found: ${ result.length }`, 'Status: true');

      return res.status(200).json({ status: true, found: result.length, result });
    }catch(err){
      app.utils.printLog(printLogTitle, 'Route: Index', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }

  async function create(req, res){
    const id = uuidv4();
    let { table_number, fk_table_locations } = req.body;

    let sequelizeTransaction = '';

    try{
      sequelizeTransaction = await app.sequelize.transaction();

      await tableRegisterValidation.validateAsync({ id, table_number, fk_table_locations });
      const result    = await app.Tables.create({ id, table_number, fk_table_locations }, { sequelizeTransaction });

      await sequelizeTransaction.commit();

      app.utils.printLog(printLogTitle, 'Route: Create', `ID: ${ result.id }`, `Table number: ${ result.table_number }`, 'Status: true');

      return res.status(201).json({ status: true, result });
    }catch(err){
      await sequelizeTransaction.rollback();

      if(err.errors){
        if(err.errors[0].message){
          app.utils.printLog(printLogTitle, 'Route: Create', 'Status: false', err.errors[0].message);

          return res.status(500).json({ status: false, message: err.errors[0].message });
        }
      }
      app.utils.printLog(printLogTitle, 'Route: Create', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }

  async function update(req, res){
    const { id } = req.params;
    let   { table_number, fk_table_locations, status } = req.body;

    let sequelizeTransaction = '';

    try{
      sequelizeTransaction = await app.sequelize.transaction();

      const ifTableExist = await app.Tables.findByPk(id);
      if(!ifTableExist) throw new Error('Table not found');

      await tableUpdateValidation.validateAsync(req.body);

      await app.Tables.update({ table_number, status, fk_table_locations }, { where: { id }}, { sequelizeTransaction });

      await sequelizeTransaction.commit();

      app.utils.printLog(printLogTitle, 'Route: Update', 'Status: true');

      return res.status(200).json({ status: true });
    }catch(err){
      await sequelizeTransaction.rollback();

      if(err.errors){
        if(err.errors[0].message){
          app.utils.printLog(printLogTitle, 'Route: Update', 'Status: false', err.errors[0].message);

          return res.status(500).json({ status: false, message: err.errors[0].message });
        }
      }
      app.utils.printLog(printLogTitle, 'Route: Update', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }

  async function remove(req, res){
    const { id } = req.params;

    let sequelizeTransaction = '';

    try{
      sequelizeTransaction = await app.sequelize.transaction();
      
      const ifTableExist = await app.Tables.findByPk(id);
      if(!ifTableExist) throw new Error('Table not found');

      await app.Tables.destroy({ where: { id }}, { sequelizeTransaction });

      await sequelizeTransaction.commit();

      app.utils.printLog(printLogTitle, 'Route: Remove', 'Status: true');

      return res.status(200).json({ status: true });
    }catch(err){
      await sequelizeTransaction.rollback();

      app.utils.printLog(printLogTitle, 'Route: Remove', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }

  app.get('/tables',                 basicAuth, index);
  app.post('/table',                 adminAuth, create);
  app.put('/table/:id',              adminAuth, update);
  app.delete('/table/:id',           adminAuth, remove);
}
