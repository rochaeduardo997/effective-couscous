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

  /**
  * @pt-BR Verifica se o usuário possui uma reserva ativa
  * @en-US Verify if user has an active reservation
  * @param user_id Refers to user primary key from database
  * @return1 You have an active reservation, cancel or edit it
  * @return2 Boolean true
  */
  async function verifyUserActiveReservation(user_id){
    try{
      if(!(await verifyIfUserExist(user_id))) return('User not found');

      const userHasActiveReservation = await app.TableReservations.findAll({ where: { fk_users: user_id }});
      for(let result of userHasActiveReservation){
        if(result.status === true) return('You have an active reservation, cancel or edit it');
      }
  
      return true;
    }catch(err){
      return err.message;
    }
  }
  /**
  * @pt-BR Verifica se a mesa possui uma reserva no horario inserido
  * @en-US Verify if table has a reservation on hour
  * @param table_id             Refers to table primary key from database
  * @param reservation_start_in Refers to start hour of reservation
  * @return1 There is an another reservation on this date and hour
  * @return2 Boolean true
  */
  async function verifyTableActiveReservation(table_id, reservation_start_in){
    try{
      const tableHasActiveReservation = await app.TableReservations.findAll({ where: { fk_tables: table_id }});
      for(let result of tableHasActiveReservation){
        if(
          result.reservation_end_in > new Date(reservation_start_in) &&
          result.status === true
        ) {
          return('There is an another reservation on this date and hour');
        }
      }
  
      return true;
    }catch(err){
      return err.message;
    }
  }
  /**
  * @pt-BR Verifica se a mesa está ocupada
  * @en-US Verify if table is occuped
  * @param table_id Refers to table primary key from database
  * @return1 Table not available
  * @return2 Table not found
  * @return3 Boolean true
  */
  async function verifyTableOccupation(table_id){
    try{
      const tableIsOccuped = await app.Tables.findByPk(table_id);
      
      if(tableIsOccuped != null){
        if(tableIsOccuped.status === false) {
          return ('Table not available');
        }
      }else if(tableIsOccuped === null){ 
        return ('Table not found');
      }

      return true;
    }catch(err){
      return err.message;
    }
  }
  /**
  * @pt-BR Verifica se a hora de inicio da reserva é menor que a de fim
  * @en-US Verify if table start reservation is lower than end
  * @param reservation_start_in Refers to start hour of reservation
  * @param reservation_end_in   Refers to end hour of reservation
  * @return1 Reservation end must be greater than start
  * @return2 Boolean true
  */
  async function verifyStartOfReservation(reservation_start_in, reservation_end_in){
    if(!(new Date(reservation_start_in) < new Date(reservation_end_in))) return('Reservation end must be greater than start');

    return true;
  }
  /**
  * @pt-BR Verifica se o usuario existe
  * @en-US Verify if user exist
  * @param user_id Refers to user primary key from database
  * @return1 User not found
  * @return2 Boolean true
  */
  async function verifyIfUserExist(user_id){
    if(!(await app.Users.findByPk(user_id))) return('User not found');

    return true;
  }
  /**
  * @pt-BR Verifica se a reserva existe
  * @en-US Verify if reservation exists
  * @param reservation_id Refers to reservation primary key from database
  * @return1 undefined
  * @return2 result from database
  */
  async function verifyIfReservationExist(reservation_id){
    try{
      const result = await app.TableReservations.findByPk(reservation_id);
      if(!result) return undefined;
      
      return result;
    }catch(err){
      return err.message;
    }
  }

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

      const resultUserActiveReservation  = await verifyUserActiveReservation(fk_users);
      const resultTableActiveReservation = await verifyTableActiveReservation(fk_tables, reservation_start_in);
      const resultTableOccupation        = await verifyTableOccupation(fk_tables);
      const resultStartOfReservation     = await verifyStartOfReservation(reservation_start_in, reservation_end_in);
      const resultUserExist              = await verifyIfUserExist(fk_users);

      if(resultUserActiveReservation  !== true) throw new Error(resultUserActiveReservation);
      if(resultTableActiveReservation !== true) throw new Error(resultTableActiveReservation);
      if(resultTableOccupation        !== true) throw new Error(resultTableOccupation);
      if(resultStartOfReservation     !== true) throw new Error(resultStartOfReservation);
      if(resultUserExist              !== true) throw new Error(resultUserExist);
      
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

      const resultUserActiveReservation = await verifyUserActiveReservation(req.id);
      const resultIfReservationExist    = await verifyIfReservationExist(id);

      if(!resultIfReservationExist)                 throw new Error('Reservation not found');
      if(resultIfReservationExist.status === false) throw new Error('This reservation has been canceled');
      if(resultUserActiveReservation     === true)  throw new Error('You do not have an active reservation yet, do one before edit it');
      
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

    let transaction = await app.sequelize.transaction();

    try{
      await tableReservationRemoveValidation.validateAsync({ id, ...req.body });

      const ifReservationExist = await verifyIfReservationExist(id);

      if(!ifReservationExist)                 throw new Error('Reservation not found');
      if(ifReservationExist.status === false) throw new Error('This reservation already been canceled');

      await app.TableReservations.update({ cancel_reason, status: false }, { where: { id }}, { transaction });

      await transaction.commit();

      app.utils.printLog(printLogTitle, 'Route: Remove', 'Type: Paranoid', 'Status: true');

      return res.status(200).json({ status: true });
    }catch(err){
      await transaction.rollback();

      app.utils.printLog(printLogTitle, 'Route: Remove', 'Type: Paranoid', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }

  app.get('/tablereservations',     adminAuth, index);
  app.post('/tablereservation',     basicAuth, create);
  app.put('/tablereservation/:id',  basicAuth, update);
  app.post('/tablereservation/:id', adminAuth, remove);
}
