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
    kovan: {
      provider: () => {
        return new HDWalletProvider(process.env.PRIVATE_KEY, "https://kovan.mudit.blog/");
      },
      network_id: '42',
      gasPrice: 2000000000
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
      version: "native",  
      settings: {
        optimizer: {
          enabled: true, 
          runs: 200    
        }
      }
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  mocha: {
    enableTimeouts: false
  }
};
