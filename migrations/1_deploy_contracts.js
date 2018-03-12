const SecurityToken = artifacts.require('./SecurityToken.sol');
const totalSupply = 100000;
const name = "TEST POLY";
const symbol = "TPOLY";

module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(SecurityToken, accounts[0], totalSupply, name, symbol, 0);
};
