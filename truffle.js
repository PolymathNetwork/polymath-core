require('babel-register');
require('babel-polyfill');

const config = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      gas: 15e6,
      gasPrice: 0x01,
      network_id: '*',
    },
    ropsten: {
      // provider: new WalletProvider(wallet, "https://ropsten.infura.io/"),
      host: 'localhost',
      port: 8545,
      network_id: 3,
      gas: 4700036,
      gasPrice: 130000000000,
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
  },
  mocha: {
    useColors: true,
    slow: 30000,
    bail: true,
  },
  dependencies: {},
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};

module.exports = config;

