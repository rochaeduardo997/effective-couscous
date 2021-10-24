const Joi            = require('joi');
const jwt            = require('jsonwebtoken');
const bcrypt         = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const adminAuth       = require('../../middleware/adminAuth');
const securityConfigs = require('../../../config/security.json');

module.exports = (app) => {
  const printLogTitle = 'Users';
  
  const userRegisterValidation = Joi.object({
    id:         Joi.string().required().guid({ version: [ 'uuidv4' ]}),

    first_name: Joi.string().required(),
    surname:    Joi.string().required(),
    username:   Joi.string().required(),

    contact:    Joi.string().required(),
    email:      Joi.string().required(),

    password:   Joi.string().required(),

    profile:    Joi.string().valid('creator', 'administrator', 'supervisor', 'dashboard', 'bartender'),

    active:     Joi.boolean()
  });
  const userUpdateValidation = Joi.object({
    id:         Joi.string().guid({ version: [ 'uuidv4' ]}),

    first_name: Joi.string(),
    surname:    Joi.string(),
    username:   Joi.string(),

    email:      Joi.string(),

    password:   Joi.string().alphanum(),

    profile:    Joi.string().valid('creator', 'administrator', 'supervisor', 'dashboard', 'bartender'),
    
    active:     Joi.boolean()
  });

  const encryptPassword = async (password) => {
    try{
      const newPassword = await bcrypt.hash(password, securityConfigs.numberOfSaltsBcrypt);

      return newPassword;
    }catch(err){
      return app.utils.printLog('Encrypt Password', 'Status: false', err.message);
    }
  };
  const decryptPassword = async (originalPassword, hashPassword) => {
    try{
      const isOriginalPassword = await bcrypt.compare(originalPassword, hashPassword);

      return isOriginalPassword;
    }catch(err){
      return app.utils.printLog('Decrypt Password', 'Status: false', err.message);
    }
  };

  async function index(req, res){
    try{
      const result = await app.Users.findAll({ attributes: { exclude: 'password' }});

      app.utils.printLog(printLogTitle, 'Route: Index', `Found: ${ result.length }`, 'Status: true');

      return res.status(200).json({ status: true, found: result.length, result });
    }catch(err){
      app.utils.printLog(printLogTitle, 'Route: Index', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }

  async function create(req, res){
    const id = uuidv4();
    let { first_name, surname, username, contact, email, password, active } = req.body;

    let sequelizeTransaction = '';

    try{
      sequelizeTransaction = await app.sequelize.transaction();

      username = username.toLowerCase();
      email    = email.toLowerCase();

      password = await encryptPassword(password);

      await userRegisterValidation.validateAsync({ id, first_name, surname, username, contact, email, password, active });
      const result    = await app.Users.create({ id, first_name, surname, username, contact, email, password, active }, { sequelizeTransaction });
      result.password = undefined;

      await sequelizeTransaction.commit();

      app.utils.printLog(printLogTitle, 'Route: Create', `ID: ${ result.id }`, `Username: ${ result.username }`, 'Status: true');

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
    let   { first_name, surname, username, contact, email, password, profile, active } = req.body;

    let sequelizeTransaction = '';

    try{
      sequelizeTransaction = await app.sequelize.transaction();

      const ifUserExist = await app.Users.findByPk(id);

      if(ifUserExist.username === 'mainadmin') throw new Error('mainadmin user canno\'t be updated');
      if(username === 'mainadmin')             throw new Error('Username canno\'t be mainadmin');
      if(profile  === 'creator')               throw new Error('creator profile canno\'t be used');
      if(!ifUserExist)                         throw new Error('User not found');

      await userUpdateValidation.validateAsync(req.body);

      if(username) username = username.toLowerCase();
      if(email)    email    = email.toLowerCase();
      if(password) password = await encryptPassword(password);

      await app.Users.update({ first_name, surname, username, contact, email, password, profile, active }, { where: { id }}, { sequelizeTransaction });

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
      
      const ifUserExist = await app.Users.findByPk(id);

      if(ifUserExist.username === 'mainadmin') throw new Error('mainadmin user canno\'t be removed');
      if(!ifUserExist)                         throw new Error('User not found');


      await app.Users.destroy({ where: { id }}, { sequelizeTransaction });

      await sequelizeTransaction.commit();
      
      await app.redis.setAsync(`login:user:${id}`, '');

      app.utils.printLog(printLogTitle, 'Route: Remove', 'Status: true');

      return res.status(200).json({ status: true });
    }catch(err){
      await sequelizeTransaction.rollback();

      app.utils.printLog(printLogTitle, 'Route: Remove', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }

  async function login(req, res){
    let { login, password } = req.body;
    try{
      const findUserByUsername = await app.Users.findOne({ where: { username: login }});
      const findUserByEmail    = await app.Users.findOne({ where: { email:    login }});
      
      const result = findUserByEmail != undefined ? findUserByEmail : findUserByUsername;

      if(result){
        const passwordMatch = await decryptPassword(password, result.password);

        if(passwordMatch) {
          const token = jwt.sign({
            id:       result.id,
            username: result.username,
            email:    result.email,
            profile:  result.profile,
            active:   result.active
          }, securityConfigs.superSecretPasswordJWT);

          await app.redis.setAsync(`login:user:${result.id}`, token);
          
          app.utils.printLog(printLogTitle, 'Route: Login', `ID: ${ result.id }`, `Login: ${ login }`, 'Status: true');

          return res.status(200).json({ status: true, token: token }); 
        } else {
          throw new Error ('Login/Password don\'t match')
        }
      }

      throw new Error('User not found or doesn\'t exists');
    }catch(err){
      app.utils.printLog(printLogTitle, 'Route: Login', 'Status: false', err.message);

      return res.status(500).json({ status: false, message: err.message });
    }
  }

  app.post('/user/login', login);
  
  app.get('/users',       adminAuth, index);
  app.post('/user',                  create);
  app.put('/user/:id',    adminAuth, update);
  app.delete('/user/:id', adminAuth, remove);
}
