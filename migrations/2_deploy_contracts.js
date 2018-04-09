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
const STVersionProxy001 = artifacts.require('./tokens/STVersionProxy001.sol');
const STVersionProxy002 = artifacts.require('./tokens/STVersionProxy002.sol');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

var BigNumber = require('bignumber.js')

const zero = "0x0000000000000000000000000000000000000000";
const totalSupply = 100000;
const name = "TEST POLY";
const symbol = "TPOLY";
const tokenDetails = "This is a legit issuance...";

module.exports = async (deployer, network, accounts) => {

  const PolymathAccount = accounts[0];
  const Issuer = accounts[1];
  const investor1 = accounts[3];
  const investor2 = accounts[4];
  const Permission = accounts[5];

  // ----------- POLYMATH NETWORK Configuration ------------

  // A) POLYMATH NETWORK Configuration :: DO THIS ONLY ONCE
  // 1. Deploy Registry, Transfer Manager, Permission Manager, (temp) PolyToken
  await deployer.deploy(PolyToken, {from: PolymathAccount});
  await deployer.deploy(ModuleRegistry, {from: PolymathAccount});
  await deployer.deploy(GeneralTransferManagerFactory, PolyToken.address, {from: PolymathAccount});
  await deployer.deploy(GeneralPermissionManagerFactory, PolyToken.address, {from: PolymathAccount});

  // 2. Register the Transfer Manager module
  let moduleRegistry = await ModuleRegistry.deployed();
  await moduleRegistry.registerModule(GeneralTransferManagerFactory.address, {from: PolymathAccount});
  await moduleRegistry.registerModule(GeneralPermissionManagerFactory.address, {from: PolymathAccount});
  await moduleRegistry.verifyModule(GeneralTransferManagerFactory.address, true, {from: PolymathAccount});
  await moduleRegistry.verifyModule(GeneralPermissionManagerFactory.address, true, {from: PolymathAccount});

  // 3. Deploy Ticker Registry and SecurityTokenRegistry
  await deployer.deploy(STVersionProxy001,GeneralTransferManagerFactory.address, GeneralPermissionManagerFactory.address, {from: PolymathAccount});
  let stVersionProxy001 = await STVersionProxy001.deployed();

  await deployer.deploy(TickerRegistry, {from: PolymathAccount});
  await deployer.deploy(SecurityTokenRegistry, PolyToken.address, ModuleRegistry.address, TickerRegistry.address,stVersionProxy001.address, {from: PolymathAccount});
  let tickerRegistry = await TickerRegistry.deployed();
  let securityTokenRegistry = await SecurityTokenRegistry.deployed();

  await tickerRegistry.setTokenRegistry(SecurityTokenRegistry.address, {from: PolymathAccount});
  await moduleRegistry.setTokenRegistry(SecurityTokenRegistry.address, {from: PolymathAccount});

  // B) DEPLOY STO factories and register them with the Registry
  await deployer.deploy(CappedSTOFactory, PolyToken.address, {from: PolymathAccount});
  let cappedSTOFactory = await CappedSTOFactory.deployed();
  await moduleRegistry.registerModule(cappedSTOFactory.address, {from: PolymathAccount});

  // await moduleRegistry.verifyModule(CappedSTOFactory.address, true, {from: PolymathAccount});

  console.log("\n")
  console.log("----- Polymath Core Contracts -----");
  console.log("*** Ticker Registry Address: ", tickerRegistry.address, "***");
  //console.log("*** Module Registry Address: ", moduleRegistry.address, "***");
  console.log("*** Security Token Registry Address: ", securityTokenRegistry.address, "***");
  console.log("*** Capped STO Factory Address: ", cappedSTOFactory.address, "***");
  console.log("-----------------------------------");
  console.log("\n")
  // -------- END OF POLYMATH NETWORK Configuration -------//

};
