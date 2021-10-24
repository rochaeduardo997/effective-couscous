const Redis           = require('redis');
const Sequelize       = require('sequelize');

const { readdirSync } = require('fs');
const { promisify }   = require('util');

const { development: databaseConfig } = require('../config/config.json');
const { printLog }                    = require('./utils');

//Sequelize configuration
const sequelize = new Sequelize(databaseConfig);

const modelFiles = readdirSync(`${__dirname}/models`);

const printLogTitle = 'Initializing';
for(let file of modelFiles){
  require(`${__dirname}/models/${file}`).init(sequelize);
  printLog(printLogTitle, 'Status: true', `Model ${file.split('.js', 1)}`);
}
printLog(printLogTitle);

for(let file of modelFiles){
  const model = require(`${__dirname}/models/${file}`);

  if(typeof model.associate === 'function') {
    model.associate(sequelize.models);
    printLog(printLogTitle, 'Status: true', `Association ${file.split('.js', 1)}`);
  }
}
printLog(printLogTitle);

//Redis configuration
const redisClient = Redis.createClient({ host: '172.17.0.4', port: '6379' });

redisClient.on('error', (err) => {
  console.error('Failed on connect to redis', err);
});

const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);

const redis = { getAsync, setAsync };

module.exports = { sequelize, redis };
