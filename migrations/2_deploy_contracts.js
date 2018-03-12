const SecurityToken = artifacts.require('./SecurityToken.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');

const owner = web3.eth.accounts[1];
const zero = "0x0000000000000000000000000000000000000000";
const totalSupply = 100000;
const name = "TEST POLY";
const symbol = "TPOLY";
const securityDetails = "This is a legit issuance...";
const perm = [1,2,3];

module.exports = async (deployer, network) => {
  await deployer.deploy(ModuleRegistry);
  await deployer.deploy(GeneralTransferManagerFactory);
  let moduleRegistry = await ModuleRegistry.deployed();
  await moduleRegistry.registerModule(GeneralTransferManagerFactory.address);
  await deployer.deploy(SecurityToken, owner, totalSupply, name, symbol, 18, securityDetails, ModuleRegistry.address);
  let securityToken = await SecurityToken.deployed();
  await securityToken.addModule(GeneralTransferManagerFactory.address, zero, 0, perm, {from: owner});
};
