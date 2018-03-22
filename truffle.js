require('babel-register');
require('babel-polyfill');
const WalletProvider = require("truffle-wallet-provider");
const keystore = require('fs').readFileSync('./sample-keystore').toString();
const pass = require('fs').readFileSync('./sample-pass').toString();
const wallet = require('ethereumjs-wallet').fromV3(keystore, pass);

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
      gas: 4500000,
    },
    mainnet: {
      host: 'localhost',
      port: 8545,
      network_id: '1', // Match any network id
      gas: 4500000,
      gasPrice: 10000000000
    },
    ropsten: {
      provider: new WalletProvider(wallet, "https://ropsten.infura.io/"),
      host: 'localhost',
      port: 8545,
      network_id: '3', // Match any network id
      gas: 4500000,
      gasPrice: 10000000000
    }
  },
  // solc: {
  //   optimizer: {
  //     enabled: true,
  //     runs: 200,
  //   },
  // },
};
