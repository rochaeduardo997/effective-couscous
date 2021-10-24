const jwt = require('jsonwebtoken');

const { superSecretPasswordJWT } = require('../../config/security.json');
const { redis }                  = require('../db');
const { printLog }               = require('../utils');

const printLogTitle = 'Auth'

module.exports = async (req, res, next) => {
  try{
    const authToken = req.headers['authorization'];
  
    if(authToken){
      const [ _, token ] = authToken.split(' ');
      
      const decoded = jwt.verify(token, superSecretPasswordJWT);

      if(decoded.id){
        const redisCacheResult = await redis.getAsync(`login:user:${decoded.id}`);

        if(redisCacheResult === token){
          req.id       = decoded.id,
          req.username = decoded.username,
          req.contact  = decoded.contact,
          req.email    = decoded.email,
          req.profile  = decoded.profile, // [ 'creator', 'administrator', 'supervisor', 'dashboard', 'bartender', 'client' ]
          req.active   = decoded.active
          
          printLog(printLogTitle, 'Auth Middleware', 'Status: true', `ID: ${ decoded.id }`, `Username: ${ decoded.username }`);
          return next();
        }
      }

      throw new Error('Token expired');
    }
    throw new Error('Authentication token is necessary');
  }catch(err){
      printLog(printLogTitle, 'Auth Middleware', 'Status: false', err.message);
      return res.status(500).json({ status: false, error: { msg: 'Failed on authentication', error: err.message }});
  }
}
