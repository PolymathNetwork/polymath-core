const DevPolyToken = artifacts.require('./helpers/PolyToken.sol')
const Web3 = require('web3')
web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

module.exports = function (deployer, network, accounts) {
  const PolymathAccount = accounts[0]
  return deployer.deploy(DevPolyToken, {from: PolymathAccount}).then(() => {})

}