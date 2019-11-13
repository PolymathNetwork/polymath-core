const fs = require('fs');
const readlineSync = require('readline-sync');
const chalk = require('chalk');
const Web3 = require('web3');
const constants = require('./constants');

global.web3, global.Issuer, global.defaultGasPrice, global.remoteNetwork;

function getGasPrice(networkId) {
  let gasPrice;
  switch (networkId) {
    case 1: //Mainnet
      gasPrice = 4000000000;
      break;
    case 3: //Ropsten
      gasPrice = 50000000000;
      break;
    case 5: //Goerli
      gasPrice = 50000000000;
      break;
    case 15: //Ganache
      gasPrice = 50000000000;
      break;
    case 42: //Kovan
      gasPrice = 50000000000;
      break;
    default:
      throw new Error('Network ID not identified');
  }
  return gasPrice;
}

function providerValidator(url) {
  var expression = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm;
  var regex = new RegExp(expression);
  return url.match(regex);
}

function getAccount(filePath) {
  if (fs.existsSync(filePath)) {
    const keyStore = JSON.parse(fs.readFileSync(filePath))
    if (!keyStore.hasOwnProperty('address')) {
      console.log(chalk.red('Your key store is not in the correct format'));
      process.exit(0);
    }
    const password = readlineSync.question(`Enter your password to start using the CLI as ${keyStore.address}: `, {
      hideEchoBack: true // The typed text on screen is hidden by `*` (default).
    });
    try {
      return web3.eth.accounts.decrypt(keyStore, password);
    } catch (error) {
      console.log(chalk.red('Could not decrypt your key store. Probably your password is wrong, please try again.'));
      return getAccount(filePath);
    }
  } else {
    let privKey = readlineSync.question('Enter your private key to generate your key store file: ', {
      hideEchoBack: true // The typed text on screen is hidden by `*` (default).
    });
    if (privKey.substr(0, 2) !== '0x') {
      privKey = '0x' + privKey;
    }
    const password = readlineSync.questionNewPassword(
      'Enter a password to encrypt your private key: ',
      { confirmMessage: 'Enter the same password to confirm: ', min: 6 }
    );
    const keyStore = web3.eth.accounts.encrypt(privKey, password);
    fs.writeFileSync(filePath, JSON.stringify(keyStore));
    return getAccount(filePath);
  }
}

module.exports = {
  initialize: async function (network) {
    remoteNetwork = network;
    if (typeof web3 === 'undefined' || typeof Issuer === 'undefined' || typeof defaultGasPrice === 'undefined') {
      if (typeof remoteNetwork !== 'undefined') {
        if (!providerValidator(remoteNetwork)) {
          console.log("Invalid remote node")
          process.exit(0)
        }
        web3 = new Web3(new Web3.providers.HttpProvider(remoteNetwork));
        Issuer = getAccount(`${__dirname}/../../../keyStore`);
      } else {
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        Issuer = getAccount(`${__dirname}/../../../keyStoreLocal`);
      }
      defaultGasPrice = getGasPrice(await web3.eth.net.getId());
    }
  },
  constants
};
