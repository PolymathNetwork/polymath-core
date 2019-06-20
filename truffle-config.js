require('babel-register');
require('babel-polyfill');
require('dotenv').config();
const NonceTrackerSubprovider = require("web3-provider-engine/subproviders/nonce-tracker")

const HDWalletProvider = require("truffle-hdwallet-provider");

let ver;
if (process.env.POLYMATH_NATIVE_SOLC) {
  ver = "native";
} else {
  ver = "0.5.8";
}

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
      gas: 7900000,
    },
    mainnet: {
      provider: () => {
        // Replace with mainnet endpoint for deployment
        // Using kovan endpoint by default to avoid accidental ether loss
        let wallet = new HDWalletProvider(process.env.PRIVATE_KEY, process.env.KOVAN_ENDPOINT)
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
      },
      network_id: '1', // Match any network id
      gas: 7900000,
      gasPrice: 10000000000 // 10 gwei
    },
    ropsten: {
      // provider: new HDWalletProvider(privKey, "http://localhost:8545"),
      host: 'localhost',
      port: 8545,
      network_id: '3', // Match any network id
      gas: 4500000,
      gasPrice: 150000000000
    },
    rinkeby: {
      // provider: new HDWalletProvider(privKey, "http://localhost:8545"),
      host: 'localhost',
      port: 8545,
      network_id: '4', // Match any network id
      gas: 7500000,
      gasPrice: 10000000000
    },
    kovan: {
      provider: () => {
        let wallet = new HDWalletProvider(process.env.PRIVATE_KEY, process.env.KOVAN_ENDPOINT)
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
      },
      network_id: '42', // Match any network id
      gasPrice: 5000000000 // 5 gwei
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8545,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffff  , // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    }
  },
  compilers: {
    solc: {
      version: ver,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  mocha: {
    enableTimeouts: false
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  }
};
