require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
      gas: 7900000,
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8545,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    }
  },
  compilers: {
    solc: {
<<<<<<< HEAD
      version: "native",  
      settings: {
        optimizer: {
          enabled: true, 
          runs: 200    
=======
      version: "native",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
>>>>>>> master
        }
      }
    }
  },
  mocha: {
    enableTimeouts: false,
    reporter: "mocha-junit-reporter",
    reporterOptions: {
      mochaFile: './test-results/mocha/results.xml'
    }
  }
};
