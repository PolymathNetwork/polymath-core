const ModuleRegistry = artifacts.require('./ModuleRegistry.sol')
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol')
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol')
const PercentageTransferManagerFactory = artifacts.require('./PercentageTransferManagerFactory.sol')
const CountTransferManagerFactory = artifacts.require('./CountTransferManagerFactory.sol')
const EtherDividendCheckpointFactory = artifacts.require('./EtherDividendCheckpointFactory.sol')
const ERC20DividendCheckpointFactory = artifacts.require('./ERC20DividendCheckpointFactory.sol')
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol')
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol')
const TickerRegistry = artifacts.require('./TickerRegistry.sol')
const STVersionProxy001 = artifacts.require('./tokens/STVersionProxy001.sol')
const DevPolyToken = artifacts.require('./helpers/PolyTokenFaucet.sol')
let BigNumber = require('bignumber.js');
const cappedSTOSetupCost = new BigNumber(20000).times(new BigNumber(10).pow(18));   // 20K POLY fee
const initRegFee = new BigNumber(250).times(new BigNumber(10).pow(18));      // 250 POLY fee for registering ticker or security token in registry
let PolyToken

const Web3 = require('web3')

module.exports = function (deployer, network, accounts) {
  // Ethereum account address hold by the Polymath (Act as the main account which have ownable permissions)
  let PolymathAccount
  let web3
  if (network === 'development') {
    web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
    PolymathAccount = accounts[0]
    PolyToken = DevPolyToken.address // Development network polytoken address
  } else if (network === 'ropsten') {
    web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/g5xfoQ0jFSE9S5LwM1Ei'))
    PolymathAccount = accounts[0]
    PolyToken = '0xafbf8a012b63c7e1ddd333882c612b7100a77d78' // PolyToken Ropsten Faucet Address
  } else if (network === 'kovan') {
    web3 = new Web3(new Web3.providers.HttpProvider('https://kovan.infura.io/g5xfoQ0jFSE9S5LwM1Ei'))
    PolymathAccount = accounts[0]
    PolyToken = '0x455Da7D06862Fa7d7639473F287f88bc7b35FF7F' // PolyToken Kovan Faucet Address
  } else if (network === 'mainnet') {
    web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/g5xfoQ0jFSE9S5LwM1Ei'))
    PolyToken = '0x9992eC3cF6A55b00978cdDF2b27BC6882d88D1eC' // Mainnet PolyToken Address
  }if (network === 'coverage') {
    web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
    PolymathAccount = accounts[0]
    PolyToken = DevPolyToken.address // Development network polytoken address
  }

  // POLYMATH NETWORK Configuration :: DO THIS ONLY ONCE
  // A) Deploy the ModuleRegistry Contract (It contains the list of verified ModuleFactory)
  return deployer.deploy(ModuleRegistry, {from: PolymathAccount}).then(() => {
    return ModuleRegistry.deployed().then((moduleRegistry) => {
      // B) Deploy the GeneralTransferManagerFactory Contract (Factory used to generate the GeneralTransferManager contract and this
      // manager attach with the securityToken contract at the time of deployment)
    return deployer.deploy(GeneralTransferManagerFactory, PolyToken, 0, 0, 0, {from: PolymathAccount})
    .then(() => {
      // C) Deploy the GeneralPermissionManagerFactory Contract (Factory used to generate the GeneralPermissionManager contract and
      // this manager attach with the securityToken contract at the time of deployment)
    return deployer.deploy(GeneralPermissionManagerFactory, PolyToken, 0, 0, 0, {from: PolymathAccount})
    }).then(() => {
      // D) Deploy the CountTransferManagerFactory Contract (Factory used to generate the CountTransferManager contract use
      // to track the counts of the investors of the security token)
      return deployer.deploy(CountTransferManagerFactory, PolyToken, 0, 0, 0, {from: PolymathAccount})
    }).then(() => {
      // D) Deploy the PercentageTransferManagerFactory Contract (Factory used to generate the PercentageTransferManager contract use
      // to track the percentage of investment the investors could do for a particular security token)
      return deployer.deploy(PercentageTransferManagerFactory, PolyToken, 0, 0, 0, {from: PolymathAccount})
    }).then(() => {
      // D) Deploy the PercentageTransferManagerFactory Contract (Factory used to generate the PercentageTransferManager contract use
      // to track the percentage of investment the investors could do for a particular security token)
      return deployer.deploy(EtherDividendCheckpointFactory, PolyToken, 0, 0, 0, {from: PolymathAccount})
    }).then(() => {
      // D) Deploy the PercentageTransferManagerFactory Contract (Factory used to generate the PercentageTransferManager contract use
      // to track the percentage of investment the investors could do for a particular security token)
      return deployer.deploy(ERC20DividendCheckpointFactory, PolyToken, 0, 0, 0, {from: PolymathAccount})
    }).then(() => {
      // D) Register the PercentageTransferManagerFactory in the ModuleRegistry to make the factory available at the protocol level.
      // So any securityToken can use that factory to generate the PercentageTransferManager contract.
      return moduleRegistry.registerModule(PercentageTransferManagerFactory.address, {from: PolymathAccount})
    }).then(() => {
      // D) Register the CountTransferManagerFactory in the ModuleRegistry to make the factory available at the protocol level.
      // So any securityToken can use that factory to generate the CountTransferManager contract.
      return moduleRegistry.registerModule(CountTransferManagerFactory.address, {from: PolymathAccount})
    }).then(() => {
      // D) Register the GeneralTransferManagerFactory in the ModuleRegistry to make the factory available at the protocol level.
      // So any securityToken can use that factory to generate the GeneralTransferManager contract.
    return moduleRegistry.registerModule(GeneralTransferManagerFactory.address, {from: PolymathAccount})
    }).then(() => {
      // E) Register the GeneralPermissionManagerFactory in the ModuleRegistry to make the factory available at the protocol level.
      // So any securityToken can use that factory to generate the GeneralPermissionManager contract.
    return moduleRegistry.registerModule(GeneralPermissionManagerFactory.address, {from: PolymathAccount})
    }).then(() => {
      // E) Register the GeneralPermissionManagerFactory in the ModuleRegistry to make the factory available at the protocol level.
      // So any securityToken can use that factory to generate the GeneralPermissionManager contract.
    return moduleRegistry.registerModule(EtherDividendCheckpointFactory.address, {from: PolymathAccount})
    }).then(() => {
      // E) Register the GeneralPermissionManagerFactory in the ModuleRegistry to make the factory available at the protocol level.
      // So any securityToken can use that factory to generate the GeneralPermissionManager contract.
    return moduleRegistry.registerModule(ERC20DividendCheckpointFactory.address, {from: PolymathAccount})
    }).then(() => {
      // F) Once the GeneralTransferManagerFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
      // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
      // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(GeneralTransferManagerFactory.address, true, {from: PolymathAccount})
    }).then(() => {
      // G) Once the CountTransferManagerFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
      // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
      // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(CountTransferManagerFactory.address, true, {from: PolymathAccount})
    }).then(() => {
      // G) Once the PercentageTransferManagerFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
      // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
      // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(PercentageTransferManagerFactory.address, true, {from: PolymathAccount})
    }).then(() => {
    // G) Once the GeneralPermissionManagerFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
      // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
      // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(GeneralPermissionManagerFactory.address, true, {from: PolymathAccount})
    }).then(() => {
    // G) Once the GeneralPermissionManagerFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
      // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
      // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(EtherDividendCheckpointFactory.address, true, {from: PolymathAccount})
    }).then(() => {
    // G) Once the GeneralPermissionManagerFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
      // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
      // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(ERC20DividendCheckpointFactory.address, true, {from: PolymathAccount})
    }).then(() => {
      // H) Deploy the STVersionProxy001 Contract which contains the logic of deployment of securityToken.
    return deployer.deploy(STVersionProxy001, GeneralTransferManagerFactory.address, {from: PolymathAccount})
    }).then(() => {
      // I) Deploy the TickerRegistry Contract (It is used to store the information about the ticker)
    return deployer.deploy(TickerRegistry, PolyToken, initRegFee, {from: PolymathAccount})
    }).then(() => {
      // J) Deploy the SecurityTokenRegistry contract (Used to hold the deployed secuirtyToken details. It also act as the interface to deploy the SecurityToken)
    return deployer.deploy(SecurityTokenRegistry, PolyToken, ModuleRegistry.address, TickerRegistry.address, STVersionProxy001.address, initRegFee, {from: PolymathAccount})
    }).then(() => {
    return TickerRegistry.deployed().then((tickerRegistry) => {
      // K) SecurityTokenRegistry address make available to the TickerRegistry contract for accessing the securityTokenRegistry functions
      return tickerRegistry.changeAddress("SecurityTokenRegistry", SecurityTokenRegistry.address, {from: PolymathAccount});
    }).then(() => {
      // L) SecurityTokenRegistry address make available to the TickerRegistry contract for accessing the securityTokenRegistry functions
    return moduleRegistry.changeAddress("SecurityTokenRegistry", SecurityTokenRegistry.address, {from: PolymathAccount});
    }).then(() => {
      // M) Deploy the CappedSTOFactory (Use to generate the CappedSTO contract which will used to collect the funds ).
    return deployer.deploy(CappedSTOFactory, PolyToken, cappedSTOSetupCost, 0, 0, {from: PolymathAccount})
    }).then(() => {
      // N) Register the CappedSTOFactory in the ModuleRegistry to make the factory available at the protocol level.
      // So any securityToken can use that factory to generate the CappedSTOFactory contract.
    return moduleRegistry.registerModule(CappedSTOFactory.address, {from: PolymathAccount})
    }).then(()=>{
      // G) Once the CappedSTOFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
      // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
      // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
      return moduleRegistry.verifyModule(CappedSTOFactory.address, true, {from: PolymathAccount})
    }).then(() => {
        console.log('\n')
        console.log('----- Polymath Core Contracts -----')
        console.log('*** Ticker Registry Address: ', TickerRegistry.address, '***')
        console.log('*** Module Registry Address: ', ModuleRegistry.address, '***')
        console.log('*** Security Token Registry Address: ', SecurityTokenRegistry.address, '***')
        console.log('*** Capped STO Factory Address: ', CappedSTOFactory.address, '***')
        console.log('*** General Permission Manager Factory: ', GeneralPermissionManagerFactory.address, '***')
        console.log('*** Count Transfer Manager Factory: ', CountTransferManagerFactory.address, '***')
        console.log('*** Percentage Transfer Manager Factory: ', PercentageTransferManagerFactory.address, '***')
        console.log('*** ETH Dividends Checkpoint Factory: ', EtherDividendCheckpointFactory.address, '***')
        console.log('*** ERC20 Dividends Checkpoint Factory: ', ERC20DividendCheckpointFactory.address, '***')
        console.log('-----------------------------------')
        console.log('\n')
        // -------- END OF POLYMATH NETWORK Configuration -------//
    })
  })
})
})
}
