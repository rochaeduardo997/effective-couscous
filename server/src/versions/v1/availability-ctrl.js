const Joi            = require('joi');
const { v4: uuidv4 } = require('uuid');

const adminAuth      = require('../../middleware/adminAuth');
const basicAuth      = require('../../middleware/basicAuth');

module.exports = (app) => {
  const printLogTitle = 'Availability';

  const availabilityRegisterValidation = Joi.object({
    availabilityId: Joi.string().required().guid({ version: [ 'uuidv4' ]}),
    dayId:          Joi.string().required().guid({ version: [ 'uuidv4' ]}),
    rangeId:        Joi.string().required().guid({ version: [ 'uuidv4' ]}),

    day_name: Joi.string().required().valid('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'),
    status:   Joi.boolean().required(),

    start_in: Joi.number().min(1).required(),
    end_in:   Joi.number().max(86400).required(),
  });
  const availabilityUpdateValidation = Joi.object({
    availabilityId: Joi.string().guid({ version: [ 'uuidv4' ]}),
    dayId:          Joi.string().guid({ version: [ 'uuidv4' ]}),
    rangeId:        Joi.string().guid({ version: [ 'uuidv4' ]}),

    day_name: Joi.string().valid('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'),
    status:   Joi.boolean(),

    start_in: Joi.number().min(1),
    end_in:   Joi.number().max(86400),
  });

  async function index(req, res){
    try{
      const availabilityResult = await app.Availability.findAll();

      let result = [];
      for(let availability of availabilityResult){

        let availabilityObj = {};
        availabilityObj.id = availability.id;

        for(let day in availability.dataValues){
          if(day !== 'id') {
            availabilityObj[day] = await app.Ranges.findOne({ 
              where: { 
                fk_days: availability.dataValues[ day ]
              },
              include:[{ 
                model: app.Days,
                attributes: { exclude: [ 'id', 'fk_table_locations', 'createdAt', 'updatedAt' ]}
              }],
              attributes: { 
                exclude: [ 'id', 'fk_days' ]
              }
            });
          }
        }

        result.push(availabilityObj);
      }

      app.utils.printLog(printLogTitle, 'Route: Index', `Found: ${ availabilityResult.length }`, 'Status: true');

      return res.status(200).json({ status: true, found: availabilityResult.length, result });
    }catch(err){
      app.utils.printLog(printLogTitle, 'Route: Index', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }
  async function findById(req, res){
    const { id } = req.params;

    try{
      const availabilityResult = await app.Availability.findByPk(id);

      let availabilityObj = {};
      availabilityObj.id  = availabilityResult.id;

      for(let day in availabilityResult.dataValues){
        if(day !== 'id') {
          availabilityObj[day] = await app.Ranges.findOne({ 
            where: { 
              fk_days: availabilityResult.dataValues[ day ]
            },
            include:[{ 
              model: app.Days,
              attributes: { exclude: [ 'fk_table_locations', 'createdAt', 'updatedAt' ]}
            }],
            attributes: { 
              exclude: [ 'fk_days' ]
            }
          });
        }
      }

      app.utils.printLog(printLogTitle, 'Route: Index', 'Status: true');

      return res.status(200).json({ status: true, found: availabilityResult.length, availabilityObj });
    }catch(err){
      app.utils.printLog(printLogTitle, 'Route: Index', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }
  async function create(req, res){
    const availabilityId = uuidv4();

    let { availability } = req.body;

    let transaction = await app.sequelize.transaction();

    try{
      await app.Availability.create({ id: availabilityId });
  
      for(let day of availability){
        const dayId   = uuidv4();
        const rangeId = uuidv4();

        const { day_name, status, ranges } = day;
        const { start_in, end_in }         = ranges;

        await availabilityRegisterValidation.validateAsync({ availabilityId, dayId, rangeId, day_name, status, start_in, end_in });
        
        await app.Days.create({ id: dayId, day_name, status });

        await app.Ranges.create({ id: rangeId, start_in, end_in, fk_days: dayId }, { transaction });

        switch (day_name) {
          case 'mon':
            await app.Availability.update({ fk_mon_id: dayId }, { where: { id: availabilityId }}, { transaction });
            break;
            
          case 'tue':
            await app.Availability.update({ fk_tue_id: dayId }, { where: { id: availabilityId }}, { transaction });
            break;
        
          case 'wed':
            await app.Availability.update({ fk_wed_id: dayId }, { where: { id: availabilityId }}, { transaction });
            break;

          case 'thu':
            await app.Availability.update({ fk_thu_id: dayId }, { where: { id: availabilityId }}, { transaction });
            break;
              
          case 'fri':
            await app.Availability.update({ fk_fri_id: dayId }, { where: { id: availabilityId }}, { transaction });
            break;
          
          case 'sat':
            await app.Availability.update({ fk_sat_id: dayId }, { where: { id: availabilityId }}, { transaction });
            break;

          case 'sun':
            await app.Availability.update({ fk_sun_id: dayId }, { where: { id: availabilityId }}, { transaction });
            break;
        }
      }
      await transaction.commit();
      app.utils.printLog(printLogTitle, 'Route: Create', `ID: ${ availabilityId }`, 'Status: true');

      const result = await app.Availability.findByPk(availabilityId);

      return res.status(201).json({ status: true, result });
    }catch(err){
      await app.Availability.destroy({ where: { id: availabilityId }}); 

      if(err.errors){
        if(err.errors[0].message){
          app.utils.printLog(printLogTitle, 'Route: Create', 'Status: false', err.errors[0].message);

          return res.status(500).json({ status: false, message: err.errors[0].message });
        }
      }
      app.utils.printLog(printLogTitle, 'Route: Create', 'Status: false', err.message);

      await transaction.rollback();

      return res.status(500).json({ status: false, message: err.message });
    }
  }

  async function update(req, res){
    const { id }           = req.params;
    let   { availability } = req.body;

    let transaction = await app.sequelize.transaction();

    try{
      await availabilityUpdateValidation.validateAsync({ availabilityId: id }); // first verification, availability only
      
      for(let fk_day in availability){
         if(fk_day !== 'id'){
          const { id: rangeId, start_in, end_in, Day } = availability[fk_day];
          const { id: dayId, day_name, status }        = Day;

          if(start_in > end_in) throw new Error('Start cannot be greater than end');

          await availabilityUpdateValidation.validateAsync({ dayId, rangeId, day_name, status, start_in, end_in}); // second verification, ranges and day

          const verifyIfRangeExist = await app.Ranges.findByPk(rangeId);
          if(!verifyIfRangeExist) throw new Error('Range not exist');

          const verifyIfDayExistInRanges = await app.Ranges.findOne({ where: { fk_days: dayId }});
          if(!verifyIfDayExistInRanges) throw new Error('Day not exist');

          const verifyIfDayExist = await app.Days.findByPk(dayId);
          if(!verifyIfDayExist) throw new Error('Day not exist');

          await app.Ranges.update({ start_in, end_in }, { where: { id: rangeId }}, { transaction });
          await app.Days.update({ status },             { where: { id: dayId }},   { transaction });
        }
      }

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

  app.get('/availability',     adminAuth, index);
  app.get('/availability/:id', adminAuth, findById);
  app.post('/availability',    adminAuth, create);
  app.put('/availability/:id', adminAuth, update);
  // app.delete('/table/:id', adminAuth, remove);
}
