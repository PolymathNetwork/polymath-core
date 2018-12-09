const moment = require('moment');	
const chalk = require('chalk');	
 function jumpToTime(timestamp) {	
  const id = Date.now();	
   return new Promise((resolve, reject) => {	
    web3.currentProvider.send(	
      {	
        jsonrpc: "2.0",	
        method: "evm_mine",	
        params: [timestamp],	
        id: id	
      },	
      (err, res) => {	
        return err ? reject(err) : resolve(res);	
      }	
    );	
  });	
}	
 async function increaseTimeByDate(toTime) {	
  if (await web3.eth.net.getId() === 15) {	
    if (toTime.isValid()) {	
      let currentTime = (await web3.eth.getBlock('latest')).timestamp;	
      if (toTime.unix() > currentTime) {	
        await jumpToTime(toTime.unix());	
        currentTime = (await web3.eth.getBlock('latest')).timestamp;	
        console.log(chalk.gree(`Current datetime is ${currentTime} or ${moment.unix(currentTime).format("MM/DD/YYYY HH:mm:ss")}`));	
      } else {	
        console.log(chalk.red(`It is not possible to go back in time. Please try again with a time in the future to travel to`));	
      }	
    } else {	
      console.log(chalk.red(`Date format is not valid. Please use a valid Unix epoch time`));	
    }	
  } else {	
    console.log(chalk.red(`Time traveling is only possible over develpment network`));	
  }	
}	
 function increaseTimeByDuration(duration) {	
  let currentTime = moment().unix();	
  let toTime = currentTime.add(duration, "seconds");	
  return increaseTimeByDate(toTime);	
}	
 function increaseTimeToDate(date) {	
  var toDate = moment(date, ['MM-DD-YYYY', 'MM-DD-YYYY HH:mm:ss']);	
  return increaseTimeByDate(toDate);	
}	
 function increaseTimeToEpochDate(epochDate) {	
  var toTime = moment.unix(epochDate);	
  return increaseTimeByDate(toTime);	
}	
 module.exports = { increaseTimeByDuration, increaseTimeToDate, increaseTimeToEpochDate };