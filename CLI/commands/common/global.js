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
  var expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
  var regex = new RegExp(expression);
  return url.match(regex);
}

async function httpProvider(url, file) {
  web3 = new Web3(new Web3.providers.HttpProvider(url));
  Issuer = await web3.eth.accounts.privateKeyToAccount("0x" + require('fs').readFileSync(file).toString());
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
        await httpProvider(remoteNetwork, './privKey');
      } else {
        await httpProvider("http://localhost:8545", './privKeyLocal');
      }
      defaultGasPrice = getGasPrice(await web3.eth.net.getId());
    }
  },
  constants
};