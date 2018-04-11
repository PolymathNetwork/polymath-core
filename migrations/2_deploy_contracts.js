const ModuleRegistry = artifacts.require('./ModuleRegistry.sol')
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol')
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol')
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol')
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol')
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol')
const TickerRegistry = artifacts.require('./TickerRegistry.sol')
const STVersionProxy001 = artifacts.require('./tokens/STVersionProxy001.sol')
let PolyToken = '0xafbf8a012b63c7e1ddd333882c612b7100a77d78' // Ropsten Faucet Address 

const Web3 = require('web3')

module.exports = function (deployer, network, accounts) {
  let PolymathAccount
  let web3
  if (network === 'development') {
    web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
    PolymathAccount = accounts[0]
  } else if (network === 'ropsten') {
    web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/g5xfoQ0jFSE9S5LwM1Ei'))
    PolymathAccount = accounts[0]
  } else if (network === 'mainnet') {
    web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/g5xfoQ0jFSE9S5LwM1Ei'))
    PolyToken = '0x9992eC3cF6A55b00978cdDF2b27BC6882d88D1eC'   // Mainnet PolyToken Address
  }
  // A) POLYMATH NETWORK Configuration :: DO THIS ONLY ONCE
  return deployer.deploy(ModuleRegistry, {from: PolymathAccount}).then(() => {
    return ModuleRegistry.deployed().then((moduleRegistry) => {
      return deployer.deploy(GeneralTransferManagerFactory, PolyToken, {from: PolymathAccount}).then(() => {
        return deployer.deploy(GeneralPermissionManagerFactory, PolyToken, {from: PolymathAccount}).then(() => {
          return moduleRegistry.registerModule(GeneralTransferManagerFactory.address, {from: PolymathAccount}).then(() => {
            return moduleRegistry.registerModule(GeneralPermissionManagerFactory.address, {from: PolymathAccount}).then(() => {
              return moduleRegistry.verifyModule(GeneralTransferManagerFactory.address, true, {from: PolymathAccount}).then(() => {
                return moduleRegistry.verifyModule(GeneralPermissionManagerFactory.address, true, {from: PolymathAccount}).then(() => {
                  return deployer.deploy(STVersionProxy001, GeneralTransferManagerFactory.address, GeneralPermissionManagerFactory.address, {from: PolymathAccount}).then(() => {
                    return deployer.deploy(TickerRegistry, {from: PolymathAccount}).then(() => {
                      return deployer.deploy(SecurityTokenRegistry, PolyToken, ModuleRegistry.address, TickerRegistry.address, STVersionProxy001.address, {from: PolymathAccount}).then(() => {
                        return TickerRegistry.deployed().then((tickerRegistry) => {
                          return tickerRegistry.setTokenRegistry(SecurityTokenRegistry.address, {from: PolymathAccount}).then(() => {
                            return moduleRegistry.setTokenRegistry(SecurityTokenRegistry.address, {from: PolymathAccount}).then(() => {
                              return deployer.deploy(DummySTOFactory, PolyToken, {from: PolymathAccount}).then(() => {
                                return moduleRegistry.registerModule(DummySTOFactory.address, {from: PolymathAccount}).then(() => {
                                  return deployer.deploy(CappedSTOFactory, PolyToken, {from: PolymathAccount}).then(() => {
                                    return moduleRegistry.registerModule(CappedSTOFactory.address, {from: PolymathAccount}).then(() => {
                                      console.log('\n')
                                      console.log('----- Polymath Core Contracts -----')
                                      console.log('*** Ticker Registry Address: ', tickerRegistry.address, '***')
                                      console.log('*** Module Registry Address: ', ModuleRegistry.address, '***')
                                      console.log('*** Security Token Registry Address: ', SecurityTokenRegistry.address, '***')
                                      console.log('*** Capped STO Factory Address: ', CappedSTOFactory.address, '***')
                                      console.log('-----------------------------------')
                                      console.log('\n')
                                      // -------- END OF POLYMATH NETWORK Configuration -------//
                                    })
                                  })
                                })
                              })
                            })
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })
}
