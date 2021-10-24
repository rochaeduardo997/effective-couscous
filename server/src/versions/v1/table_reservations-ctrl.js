const Joi            = require('joi');
const { v4: uuidv4 } = require('uuid');

const adminAuth      = require('../../middleware/adminAuth');
const basicAuth      = require('../../middleware/basicAuth');

module.exports = (app) => {
  const printLogTitle = 'Table Reservations';

  const tableReservationRegisterValidation = Joi.object({
    id:                 Joi.string().required().guid({ version: [ 'uuidv4' ]}),

    how_many_people:    Joi.number().min(1).required(),
    is_party:           Joi.boolean(),

    fk_users:           Joi.string().required().guid({ version: [ 'uuidv4' ]}),
    fk_tables:          Joi.string().required().guid({ version: [ 'uuidv4' ]}),
  });
  const tableReservationUpdateValidation = Joi.object({
    id:                 Joi.string().guid({ version: [ 'uuidv4' ]}),

    how_many_people:    Joi.number().min(1),
    is_party:           Joi.boolean(),

    fk_users:           Joi.string().guid({ version: [ 'uuidv4' ]}),
    fk_tables:          Joi.string().guid({ version: [ 'uuidv4' ]}),
  });
  const tableReservationRemoveValidation = Joi.object({
    id:            Joi.string().required().guid({ version: [ 'uuidv4' ]}),
    
    cancel_reason: Joi.string().required()
  });

  async function index(req, res){
    try{
      const result = await app.TableReservations.findAll({
        include:[{ 
          model: app.Tables,
          include: [{ 
            model: app.TableLocations,
            attributes:{ exclude: [ 'createdAt', 'updatedAt' ]}
          }],
          attributes:{ exclude: [ 'fk_table_locations', 'createdAt', 'updatedAt' ]}
        },{ 
          model: app.Users ,
          attributes:{ exclude: [ 'password', 'createdAt', 'updatedAt' ]}
        }],
        attributes:{ exclude: [ 'fk_tables', 'fk_users' ] }
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
    let { reservation_start_in, reservation_end_in, how_many_people, is_party, fk_users, fk_tables } = req.body;

    let transaction = await app.sequelize.transaction();

    try{
      if(!fk_users) fk_users = req.id;
      await tableReservationRegisterValidation.validateAsync({ id, how_many_people, is_party, fk_users, fk_tables });

      const userHasActiveReservation  = await app.TableReservations.findAll({ where: { fk_users: req.id }});
      const tableHasActiveReservation = await app.TableReservations.findAll({ where: { fk_tables }});

      for(let result of userHasActiveReservation){
        if(result.status === true) throw new Error('You have an active reservation, cancel or edit it');
      }
      for(let result of tableHasActiveReservation){
        if(result.reservation_end_in > new Date(reservation_start_in)) throw new Error('There is an another reservation on this date and hour');
      }

      if(!(await app.Users.findByPk(fk_users))) throw new Error('User not found');

      const tableIsOccuped = await app.Tables.findByPk(fk_tables);
      if(tableIsOccuped != null){
        if(tableIsOccuped.status === false) {
          throw new Error('Table do not available');
        }
      }else if(tableIsOccuped === null){ 
        throw new Error('Table not found');
      }
      
      if(!(new Date(reservation_start_in) < new Date(reservation_end_in))) throw new Error('Reservation end must be greater than start');
      const result = await app.TableReservations.create({ id, reservation_start_in, reservation_end_in, how_many_people, is_party, fk_users, fk_tables }, { transaction });
      
      await transaction.commit();

      app.utils.printLog(printLogTitle, 'Route: Create', `ID: ${ result.id }`, 'Status: true');

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
    const { id } = req.params;
    let   { how_many_people, is_party } = req.body;

    let transaction = await app.sequelize.transaction();

    try{
      await tableReservationUpdateValidation.validateAsync({ how_many_people, is_party });

      const userHasReservationActive = await app.TableReservations.findOne({}, { where: fk_users = req.id });
      const ifReservationExist       = await app.TableReservations.findByPk(id);

      if(userHasReservationActive === null)   throw new Error('You do not have an active reservation yet, do one before edit it');
      if(!ifReservationExist)                 throw new Error('Reservation not found');
      if(ifReservationExist.status === false) throw new Error('Reservation has been canceled');
      
      await app.TableReservations.update({ how_many_people, is_party }, { where: { id }}, { transaction });

      await transaction.commit();

      app.utils.printLog(printLogTitle, 'Route: Update', 'Status: true');

      return res.status(200).json({ status: true });
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

  async function remove(req, res){
    const { id }            = req.params;
    let   { cancel_reason } = req.body

    let sequelizeTransaction = '';

    try{
      sequelizeTransaction = await app.sequelize.transaction();

      await tableReservationRemoveValidation.validateAsync({ id, ...req.body });

      const ifReservationExist = await app.TableReservations.findByPk(id);
      if(!ifReservationExist) throw new Error('Reservation not found');
      if(ifReservationExist.status === false) throw new Error('Reservation has been canceled');

      await app.TableReservations.update({ cancel_reason, status: false }, { where: { id }}, { sequelizeTransaction });

      await sequelizeTransaction.commit();

      app.utils.printLog(printLogTitle, 'Route: Remove', 'Type: Paranoid', 'Status: true');

      return res.status(200).json({ status: true });
    }catch(err){
      await sequelizeTransaction.rollback();

      app.utils.printLog(printLogTitle, 'Route: Remove', 'Type: Paranoid', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }

  app.get('/tablereservations',     adminAuth, index);
  app.post('/tablereservation',     basicAuth, create);
  app.put('/tablereservation/:id',  adminAuth, update);
  app.post('/tablereservation/:id', adminAuth, remove);
}
