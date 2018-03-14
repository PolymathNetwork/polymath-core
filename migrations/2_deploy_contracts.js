const SecurityToken = artifacts.require('./SecurityToken.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const SecurityTokenRegistrar = artifacts.require('./SecurityTokenRegistrar.sol');
const TickerRegistrar = artifacts.require('./TickerRegistrar.sol');

const owner = web3.eth.accounts[1];
const admin = web3.eth.accounts[2];
const zero = "0x0000000000000000000000000000000000000000";
const totalSupply = 100000;
const name = "TEST POLY";
const symbol = "TPOLY";
const securityDetails = "This is a legit issuance...";
const perm = [1,2,3];

module.exports = async (deployer, network) => {
  await deployer.deploy(ModuleRegistry);
  await deployer.deploy(GeneralTransferManagerFactory);
  await deployer.deploy(DummySTOFactory);

  let moduleRegistry = await ModuleRegistry.deployed();
  await moduleRegistry.registerModule(GeneralTransferManagerFactory.address);
  await moduleRegistry.registerModule(DummySTOFactory.address);

  await deployer.deploy(TickerRegistrar, {from: admin});
  await deployer.deploy(SecurityTokenRegistrar, ModuleRegistry.address, TickerRegistrar.address, GeneralTransferManagerFactory.address);

  let tickerRegistrar = await TickerRegistrar.deployed();
  await tickerRegistrar.setTokenRegistrar(SecurityTokenRegistrar.address, {from: admin });
  await tickerRegistrar.registerTicker(symbol, "poly@polymath.network", { from: owner });

  let STRegistrar = await SecurityTokenRegistrar.deployed();
  await STRegistrar.generateSecurityToken(owner, name, symbol, 18, securityDetails);

  let securityToken = await SecurityToken.deployed();
  await securityToken.addModule(GeneralTransferManagerFactory.address, zero, 0, perm, true, {from: owner});
  await securityToken.addModule(DummySTOFactory.address, zero, 0, perm, false, {from: owner});
};
