const Joi            = require('joi');
const { v4: uuidv4 } = require('uuid');

const adminAuth      = require('../../middleware/adminAuth');
const basicAuth      = require('../../middleware/basicAuth');

module.exports = (app) => {
  const printLogTitle = 'Availability';

  async function index(req, res){
    try{
      const availabilityResult = await app.Availability.findAll();

      let result = [];
      for(let availability of availabilityResult){

        let availabilityObj = {};
        availabilityObj.id = availability.id;

        for(let day in availability.dataValues){
          if(day !== 'id') availabilityObj[day] = await app.Ranges.findOne({ where: { fk_days: availability.dataValues[ day ]}, attributes: { exclude: [ 'id', 'fk_days' ]}});
          console.log(availability.dataValues[day])
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

      const result = await app.Availability.findByPk(availabilityId)

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

  app.get('/availability',  basicAuth, index);
  app.post('/availability', adminAuth, create);
  // app.put('/table/:id',    adminAuth, update);
  // app.delete('/table/:id', adminAuth, remove);
}
