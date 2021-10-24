const chalk = require('chalk');

module.exports = {
  printLog(from, ...args){
    let allArgs = '';
    for(let arg of args){
      allArgs = allArgs + arg + ' | ';
    }

    console.log(chalk.inverse.bold(' ', new Date().toISOString(), ' '), '|', chalk.inverse.bold(' ', from, ' '), '|', allArgs);
  }
}