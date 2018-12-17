const moment = require('moment');
const chalk = require('chalk');

function increaseTime(duration) {
  const id = Date.now();

  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [duration],
        id: id
      },
      err1 => {
        if (err1) return reject(err1);

        web3.currentProvider.send(
          {
            jsonrpc: "2.0",
            method: "evm_mine",
            id: id + 1
          },
          (err2, res) => {
            return err2 ? reject(err2) : resolve(res);
          }
        );
      }
    );
  });
}

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
        console.log(chalk.green(`Current datetime is ${currentTime} or ${moment.unix(currentTime).format("MM/DD/YYYY HH:mm:ss")}`));
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

async function increaseTimeByDuration(duration) {
  if (await web3.eth.net.getId() === 15) {
    if (duration > 0) {
      await increaseTime(duration);
      currentTime = (await web3.eth.getBlock('latest')).timestamp;
      console.log(chalk.green(`Current datetime is ${currentTime} or ${moment.unix(currentTime).format("MM/DD/YYYY HH:mm:ss")}`));
    } else {
      console.log(chalk.red(`It is not possible to go back in time. Please try again with a time in the future to travel to`));
    }
  } else {
    console.log(chalk.red(`Time traveling is only possible over develpment network`));
  }
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
