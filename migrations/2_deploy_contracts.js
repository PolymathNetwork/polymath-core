const Authorized = artifacts.require('./Authorized.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const RegulatorService = artifacts.require('./RegulatorService.sol');
const owner =  0x37dd47bb0ED2d8Ae0E6aC17935316FC8F75b75da;
const totalSupply = 100000; 
const name = "TEST POLY";
const symbol = "TPOLY"; 

module.exports = async (deployer, network) => {
  await deployer.deploy(RegulatorService);
  await deployer.deploy(Authorized, RegulatorService.address);
  await deployer.deploy(SecurityToken, owner, totalSupply, name, symbol, Authorized.address);
};
