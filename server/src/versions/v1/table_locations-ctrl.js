const Joi            = require('joi');
const { v4: uuidv4 } = require('uuid');

const adminAuth = require('../../middleware/adminAuth');

module.exports = (app) => {
  const printLogTitle = 'Table Locations';
  
  const locationRegisterValidation = Joi.object({
    id:       Joi.string().required().guid({ version: [ 'uuidv4' ]}),

    location: Joi.string().required()
  });
  const locationUpdateValidation = Joi.object({
    id:       Joi.string().guid({ version: [ 'uuidv4' ]}),

    location: Joi.string().required()
  });

  async function index(req, res){
    try{
      const result = await app.TableLocations.findAll();

      app.utils.printLog(printLogTitle, 'Route: Index', `Found: ${ result.length }`, 'Status: true');

      return res.status(200).json({ status: true, found: result.length, result });
    }catch(err){
      app.utils.printLog(printLogTitle, 'Route: Index', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }

  async function create(req, res){
    const id         = uuidv4();
    let { location } = req.body;

    let transaction = await app.sequelize.transaction();

    try{
      location = app.utils.toTitle(location);

      await locationRegisterValidation.validateAsync({ id, location });
      const result = await app.TableLocations.create({ id, location }, { transaction });

      await transaction.commit();

      app.utils.printLog(printLogTitle, 'Route: Create', `ID: ${ result.id }`, `Location: ${ result.location }`, 'Status: true');

      return res.status(201).json({ status: true, result });
    }catch(err){
      await transaction.rollback();

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
    const { id }       = req.params;
    let   { location } = req.body;

    let transaction = await app.sequelize.transaction();

    try{
      location = app.utils.toTitle(location);

      if(!(await app.TableLocations.findByPk(id))) throw new Error('Table location not found');

      await locationUpdateValidation.validateAsync(req.body);

      await app.TableLocations.update({ location }, { where: { id }}, { transaction });

      await transaction.commit();

      app.utils.printLog(printLogTitle, 'Route: Update', 'Status: true');

      return res.status(200).json({ status: true });
    }catch(err){
      await transaction.rollback();

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

    let transaction = await app.sequelize.transaction();

    try{
      if(!(await app.TableLocations.findByPk(id))) throw new Error('Table location not found');

      await app.TableLocations.destroy({ where: { id }}, { transaction });

      await transaction.commit();

      app.utils.printLog(printLogTitle, 'Route: Remove', 'Status: true');

      return res.status(200).json({ status: true });
    }catch(err){
      await transaction.rollback();

      app.utils.printLog(printLogTitle, 'Route: Remove', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }
  
  app.get('/tablelocations',       adminAuth, index);
  app.post('/tablelocation',       adminAuth, create);
  app.put('/tablelocation/:id',    adminAuth, update);
  app.delete('/tablelocation/:id', adminAuth, remove);
}
