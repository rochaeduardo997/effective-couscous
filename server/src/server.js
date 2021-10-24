const { readdirSync } = require('fs');
const express         = require('express');
// const cors            = require('cors');
const app             = express();

const PORT = 3000;

app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
// app.use(cors());

const utils     = require('./utils');
const db        = require('./db');

app.utils     = utils;
app.utils.printLog('Initializing', 'Status: true', 'Utils');

app.sequelize = db.sequelize;
app.utils.printLog('Initializing', 'Status: true', 'Sequelize');

app.redis     = db.redis;
app.utils.printLog('Initializing', 'Status: true', 'Redis');

app.utils.printLog('Initializing');

const crudFiles  = readdirSync(`${__dirname}/versions/v1/`);
const modelFiles = readdirSync(`${__dirname}/models/`);

// pre-load all controllers with express and all models from sequelize
for(let file of crudFiles){
  const crudFile = require(`${__dirname}/versions/v1/${file}`);

  for(let model of modelFiles){
    const modelFile          = require(`${__dirname}/models/${model}`);
    app[model.split('.', 1)] = modelFile;
  }
  
  crudFile(app);
  app.utils.printLog('Initializing', 'Status: true', 'Controller', file);
}
app.utils.printLog('Initializing');

app.use(`${__dirname}/versions/v1/*`, (req, res, next)=>{ next() });

app.listen(PORT, (err) => {
  if(err){
    app.utils.printLog('Initializing', `API startup has failed\n${err.message}`);
  }

  app.utils.printLog('     UP     ', `API runing at http://localhost:${PORT}`);
});
