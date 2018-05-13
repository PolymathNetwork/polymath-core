require('babel-register');
require('babel-polyfill');

const HDWalletProvider = require("truffle-hdwallet-provider-privkey");
// const privKey = require('fs').readFileSync('./privKey').toString();

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
      // provider: new HDWalletProvider(privKey, "http://localhost:8545"),
      host: 'localhost',
      port: 8545,
      network_id: '3', // Match any network id
      gas: 4500000,
      gasPrice: 150000000000
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8545,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};
