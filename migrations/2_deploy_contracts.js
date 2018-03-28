const PolyToken = artifacts.require('./helpers/PolyToken.sol');
const SecurityToken = artifacts.require('./tokens/SecurityToken.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager.sol');
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO= artifacts.require('./CappedSTO.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
const STVersionProxy_001 = artifacts.require('./tokens/STVersionProxy_001.sol');

var BigNumber = require('bignumber.js');

const Web3 = require('web3');
var web3; 

const zero = "0x0000000000000000000000000000000000000000";
const totalSupply = 100000;
const name = "TEST POLY";
const symbol = "TPOLY";
const tokenDetails = "This is a legit issuance...";

module.exports = function (deployer, network, accounts) {
    const PolymathAccount = accounts[0];
    var Issuer;
  
    if (network == 'development') {
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      Issuer = accounts[1];
    }
    else if (network == 'ropsten') {
      web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/g5xfoQ0jFSE9S5LwM1Ei"));
      PolymathAccount = Issuer;
    }
    else if (network == 'mainnet') {
      web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/g5xfoQ0jFSE9S5LwM1Ei"));
    }
     
    // A) POLYMATH NETWORK Configuration :: DO THIS ONLY ONCE
    // 1. Deploy Registry, Transfer Manager, Permission Manager, (temp) PolyToken
      return deployer.deploy(ModuleRegistry, {from: PolymathAccount}).then(() => {
        return ModuleRegistry.deployed().then((moduleRegistry) => {
            return deployer.deploy(GeneralTransferManagerFactory, {from: PolymathAccount}).then(() => {
              return deployer.deploy(GeneralPermissionManagerFactory, {from: PolymathAccount}).then(() => {
                  return deployer.deploy(PolyToken).then(()=> {
                      // 2. Register the Transfer Manager module
                      return moduleRegistry.registerModule(GeneralTransferManagerFactory.address, {from: PolymathAccount}).then(() => {
                          return moduleRegistry.registerModule(GeneralPermissionManagerFactory.address, {from: PolymathAccount}).then(() => {
                            return moduleRegistry.verifyModule(GeneralTransferManagerFactory.address, true, {from: PolymathAccount}).then(() => {
                              return moduleRegistry.verifyModule(GeneralPermissionManagerFactory.address, true, {from: PolymathAccount}).then(() => {
                                 // 3. Deploy Ticker Registry and SecurityTokenRegistry  
                                    return deployer.deploy(STVersionProxy_001, GeneralTransferManagerFactory.address, GeneralPermissionManagerFactory.address, {from: PolymathAccount}).then(() => {
                                      return deployer.deploy(TickerRegistry, {from: PolymathAccount}).then(() => {
                                          return deployer.deploy(SecurityTokenRegistry, PolyToken.address, ModuleRegistry.address, TickerRegistry.address, STVersionProxy_001.address, {from: PolymathAccount}).then(() =>{
                                              return TickerRegistry.deployed().then((tickerRegistry) => {
                                                  return tickerRegistry.setTokenRegistry(SecurityTokenRegistry.address, {from: PolymathAccount}).then(()=>{
                                                  // B) DEPLOY STO factories and register them with the Registry
                                                    return deployer.deploy(CappedSTOFactory, {from: PolymathAccount}).then(() => {
                                                        return moduleRegistry.registerModule(CappedSTOFactory.address, {from: PolymathAccount}).then(() => {
                                                          console.log("\n")
                                                          console.log("----- Polymath Core Contracts -----");
                                                          console.log("*** Ticker Registry Address: ", TickerRegistry.address, "***");
                                                          console.log("*** Module Registry Address: ", ModuleRegistry.address, "***");
                                                          console.log("*** Security Token Registry Address: ", SecurityTokenRegistry.address, "***");
                                                          console.log("*** Capped STO Factory Address: ", CappedSTOFactory.address, "***");
                                                          console.log("-----------------------------------");
                                                          console.log("\n")
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
