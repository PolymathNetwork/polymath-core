const PolyToken = artifacts.require('./helpers/PolyToken.sol');
const SecurityToken = artifacts.require('./tokens/SecurityToken.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager.sol');
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO= artifacts.require('./DummySTO.sol');
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO= artifacts.require('./CappedSTO.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');
const STVersionProxy001 = artifacts.require('./tokens/STVersionProxy001.sol');

var BigNumber = require('bignumber.js');

const Web3 = require('web3');
var web3; 



const zero = "0x0000000000000000000000000000000000000000";
const totalSupply = 100000;
const name = "TEST POLY";
const symbol = "TPOLY";
const tokenDetails = "This is a legit issuance...";

module.exports = function (deployer, network, accounts) {
    var investor1;
    const PolymathAccount = accounts[0];
    var Issuer;
  
    if (network == 'development') {
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      investor1 = accounts[3];
      Issuer = accounts[1];
    }
    else if (network == 'ropsten') {
      web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/g5xfoQ0jFSE9S5LwM1Ei"));
      investor1 = '0x37e1411f518226a7e1b4e8eb8bb0e0e9f7f86580';
      Issuer = PolymathAccount;
    }
    else if (network == 'mainnet') {
      web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/g5xfoQ0jFSE9S5LwM1Ei"));
    }
     
    // A) POLYMATH NETWORK Configuration :: DO THIS ONLY ONCE
    // 1. Deploy the token faucet of polymath
    return deployer.deploy(PolyTokenFaucet).then(() => {
       return deployer.deploy(ModuleRegistry, {from: PolymathAccount}).then(() => {
          return ModuleRegistry.deployed().then((moduleRegistry) => {
             return deployer.deploy(GeneralTransferManagerFactory, {from: PolymathAccount}).then(() => {
                return deployer.deploy(GeneralPermissionManagerFactory, {from: PolymathAccount}).then(() => {
                    return deployer.deploy(PolyToken).then(() => {
                        return moduleRegistry.registerModule(GeneralTransferManagerFactory.address, {from: PolymathAccount}).then(() => {
                            return moduleRegistry.registerModule(GeneralPermissionManagerFactory.address, {from: PolymathAccount}).then(() => {
                                return moduleRegistry.verifyModule(GeneralTransferManagerFactory.address, true, {from: PolymathAccount}).then(() => {
                                    return moduleRegistry.verifyModule(GeneralPermissionManagerFactory.address, true, {from: PolymathAccount}).then(() => {
                                        return deployer.deploy(STVersionProxy001, GeneralTransferManagerFactory.address, GeneralPermissionManagerFactory.address, {from: PolymathAccount}).then(() => {
                                            return deployer.deploy(TickerRegistry, {from: PolymathAccount}).then(() => {
                                                return deployer.deploy(SecurityTokenRegistry, PolyToken.address, ModuleRegistry.address, TickerRegistry.address, STVersionProxy001.address, {from: PolymathAccount}).then(() => {
                                                    return TickerRegistry.deployed().then((tickerRegistry) => {
                                                        return tickerRegistry.setTokenRegistry(SecurityTokenRegistry.address, {from: PolymathAccount}).then(() => {
                                                            return moduleRegistry.setTokenRegistry(SecurityTokenRegistry.address, {from: PolymathAccount}).then(() => {
                                                                return deployer.deploy(DummySTOFactory, {from: PolymathAccount}).then(() => {
                                                                    return moduleRegistry.registerModule(DummySTOFactory.address, {from: PolymathAccount}).then(() => {
                                                                        return deployer.deploy(CappedSTOFactory, {from: PolymathAccount}).then(() => {
                                                                            return moduleRegistry.registerModule(CappedSTOFactory.address, {from: PolymathAccount}).then(() => {
                                                                                console.log("\n")
                                                                                console.log("----- Polymath Core Contracts -----");
                                                                                console.log("*** Ticker Registry Address: ", tickerRegistry.address, "***");
                                                                                //console.log("*** Module Registry Address: ", moduleRegistry.address, "***");
                                                                                console.log("*** Security Token Registry Address: ", SecurityTokenRegistry.address, "***");
                                                                                console.log("*** Capped STO Factory Address: ", CappedSTOFactory.address, "***");
                                                                                console.log("-----------------------------------");
                                                                                console.log("\n")
                                                                                // -------- END OF POLYMATH NETWORK Configuration -------//
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

};
