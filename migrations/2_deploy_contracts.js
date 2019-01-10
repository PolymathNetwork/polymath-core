const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol')
const GeneralTransferManagerLogic = artifacts.require('./GeneralTransferManager.sol')
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol')
const PercentageTransferManagerFactory = artifacts.require('./PercentageTransferManagerFactory.sol')
const USDTieredSTOLogic = artifacts.require('./USDTieredSTO.sol');
const CountTransferManagerFactory = artifacts.require('./CountTransferManagerFactory.sol')
const EtherDividendCheckpointLogic = artifacts.require('./EtherDividendCheckpoint.sol')
const ERC20DividendCheckpointLogic = artifacts.require('./ERC20DividendCheckpoint.sol')
const EtherDividendCheckpointFactory = artifacts.require('./EtherDividendCheckpointFactory.sol')
const ERC20DividendCheckpointFactory = artifacts.require('./ERC20DividendCheckpointFactory.sol')
const VestingEscrowWalletFactory = artifacts.require('./VestingEscrowWalletFactory.sol');
const VestingEscrowWalletLogic = artifacts.require('./VestingEscrowWallet.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const ModuleRegistryProxy = artifacts.require('./ModuleRegistryProxy.sol');
const ManualApprovalTransferManagerFactory = artifacts.require('./ManualApprovalTransferManagerFactory.sol')
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol')
const USDTieredSTOFactory = artifacts.require('./USDTieredSTOFactory.sol')
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol')
const SecurityTokenRegistryProxy = artifacts.require('./SecurityTokenRegistryProxy.sol')
const VolumeRestrictionTMFactory = artifacts.require('./VolumeRestrictionTMFactory.sol')
const VolumeRestrictionTMLogic = artifacts.require('./VolumeRestrictionTM.sol');
const FeatureRegistry = artifacts.require('./FeatureRegistry.sol')
const STFactory = artifacts.require('./tokens/STFactory.sol')
const DevPolyToken = artifacts.require('./helpers/PolyTokenFaucet.sol')
const MockOracle = artifacts.require('./MockOracle.sol')
const TokenLib = artifacts.require('./TokenLib.sol');
const SecurityToken = artifacts.require('./tokens/SecurityToken.sol')

let BigNumber = require('bignumber.js');
const cappedSTOSetupCost = new BigNumber(20000).times(new BigNumber(10).pow(18));   // 20K POLY fee
const usdTieredSTOSetupCost = new BigNumber(100000).times(new BigNumber(10).pow(18));   // 100K POLY fee
const initRegFee = new BigNumber(250).times(new BigNumber(10).pow(18));      // 250 POLY fee for registering ticker or security token in registry
let PolyToken;
let UsdToken;
let ETHOracle;
let POLYOracle;

const Web3 = require('web3')

module.exports = function (deployer, network, accounts) {
  // Ethereum account address hold by the Polymath (Act as the main account which have ownable permissions)
  let PolymathAccount;
  let moduleRegistry;
  let polymathRegistry;
  let web3
  if (network === 'development') {
    web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
    PolymathAccount = accounts[0]
    PolyToken = DevPolyToken.address // Development network polytoken address
    deployer.deploy(DevPolyToken, { from: PolymathAccount }).then(() => {
      DevPolyToken.deployed().then((mockedUSDToken) => {
        UsdToken = mockedUSDToken.address;
      });
    });
    deployer.deploy(MockOracle, PolyToken, "POLY", "USD", new BigNumber(0.5).times(new BigNumber(10).pow(18)), { from: PolymathAccount }).then(() => {
      MockOracle.deployed().then((mockedOracle) => {
        POLYOracle = mockedOracle.address;
      });
    });
    deployer.deploy(MockOracle, 0, "ETH", "USD", new BigNumber(500).times(new BigNumber(10).pow(18)), { from: PolymathAccount }).then(() => {
      MockOracle.deployed().then((mockedOracle) => {
        ETHOracle = mockedOracle.address;
      });
    });

  } else if (network === 'kovan') {
    web3 = new Web3(new Web3.providers.HttpProvider('https://kovan.infura.io/g5xfoQ0jFSE9S5LwM1Ei'))
    PolymathAccount = accounts[0]
    PolyToken = '0xb347b9f5b56b431b2cf4e1d90a5995f7519ca792' // PolyToken Kovan Faucet Address
    POLYOracle = '0x461d98EF2A0c7Ac1416EF065840fF5d4C946206C' // Poly Oracle Kovan Address
    ETHOracle = '0xCE5551FC9d43E9D2CC255139169FC889352405C8' // ETH Oracle Kovan Address
  } else if (network === 'mainnet') {
    web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/g5xfoQ0jFSE9S5LwM1Ei'))
    PolymathAccount = accounts[0]
    PolyToken = '0x9992eC3cF6A55b00978cdDF2b27BC6882d88D1eC' // Mainnet PolyToken Address
    POLYOracle = '0x52cb4616E191Ff664B0bff247469ce7b74579D1B' // Poly Oracle Mainnet Address
    ETHOracle = '0x60055e9a93aae267da5a052e95846fa9469c0e7a' // ETH Oracle Mainnet Address
  } if (network === 'coverage') {
    web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
    PolymathAccount = accounts[0]
    PolyToken = DevPolyToken.address // Development network polytoken address
    deployer.deploy(MockOracle, PolyToken, "POLY", "USD", new BigNumber(0.5).times(new BigNumber(10).pow(18)), { from: PolymathAccount }).then(() => {
      MockOracle.deployed().then((mockedOracle) => {
        POLYOracle = mockedOracle.address;
      });
    });
    deployer.deploy(MockOracle, 0, "ETH", "USD", new BigNumber(500).times(new BigNumber(10).pow(18)), { from: PolymathAccount }).then(() => {
      MockOracle.deployed().then((mockedOracle) => {
        ETHOracle = mockedOracle.address;
      });
    });
  }

  const functionSignatureProxy = {
    name: 'initialize',
    type: 'function',
    inputs: [{
      type: 'address',
      name: '_polymathRegistry'
    }, {
      type: 'address',
      name: '_STFactory'
    }, {
      type: 'uint256',
      name: '_stLaunchFee'
    }, {
      type: 'uint256',
      name: '_tickerRegFee'
    }, {
      type: 'address',
      name: '_polyToken'
    }, {
      type: 'address',
      name: '_owner'
    }]
  };

  const functionSignatureProxyMR = {
    name: 'initialize',
    type: 'function',
    inputs: [{
      type: 'address',
      name: '_polymathRegistry'
    }, {
      type: 'address',
      name: '_owner'
    }]
  };

  // POLYMATH NETWORK Configuration :: DO THIS ONLY ONCE
  // A) Deploy the PolymathRegistry contract
  return deployer.deploy(PolymathRegistry, { from: PolymathAccount }).then(() => {
    return PolymathRegistry.deployed();
  }).then((_polymathRegistry) => {
    polymathRegistry = _polymathRegistry;
    return polymathRegistry.changeAddress("PolyToken", PolyToken, { from: PolymathAccount });
  }).then(() => {
    // Deploy libraries
    return deployer.deploy(TokenLib, { from: PolymathAccount });
  }).then(() => {
    // Link libraries
    deployer.link(TokenLib, SecurityToken);
    deployer.link(TokenLib, STFactory);
    // A) Deploy the ModuleRegistry Contract (It contains the list of verified ModuleFactory)
    return deployer.deploy(ModuleRegistry, { from: PolymathAccount });
  }).then(() => {
    return deployer.deploy(ModuleRegistryProxy, { from: PolymathAccount });
  }).then(() => {
    let bytesProxyMR = web3.eth.abi.encodeFunctionCall(functionSignatureProxyMR, [polymathRegistry.address, PolymathAccount]);
    return ModuleRegistryProxy.at(ModuleRegistryProxy.address).upgradeToAndCall("1.0.0", ModuleRegistry.address, bytesProxyMR, { from: PolymathAccount });
  }).then(() => {
    moduleRegistry = ModuleRegistry.at(ModuleRegistryProxy.address);
    // Add module registry to polymath registry
    return polymathRegistry.changeAddress("ModuleRegistry", ModuleRegistryProxy.address, { from: PolymathAccount });
  }).then(() => {
    // B) Deploy the GeneralTransferManagerLogic Contract (Factory used to generate the GeneralTransferManager contract and this
    // manager attach with the securityToken contract at the time of deployment)
    return deployer.deploy(GeneralTransferManagerLogic, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: PolymathAccount });
  }).then(() => {
    // B) Deploy the ERC20DividendCheckpointLogic Contract (Factory used to generate the ERC20DividendCheckpoint contract and this
    // manager attach with the securityToken contract at the time of deployment)
    return deployer.deploy(ERC20DividendCheckpointLogic, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: PolymathAccount });
  }).then(() => {
    // B) Deploy the EtherDividendCheckpointLogic Contract (Factory used to generate the EtherDividendCheckpoint contract and this
    // manager attach with the securityToken contract at the time of deployment)
    return deployer.deploy(EtherDividendCheckpointLogic, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: PolymathAccount });
  }).then(() => {
    // B) Deploy the VestingEscrowWalletLogic Contract (Factory used to generate the VestingEscrowWallet contract and this
    // manager attach with the securityToken contract at the time of deployment)
    return deployer.deploy(VestingEscrowWalletLogic, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: PolymathAccount });
  }).then(() => {
    // B) Deploy the USDTieredSTOLogic Contract (Factory used to generate the USDTieredSTO contract and this
    // manager attach with the securityToken contract at the time of deployment)
    return deployer.deploy(USDTieredSTOLogic, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: PolymathAccount });
  }).then(() => {
    // B) Deploy the VolumeRestrictionTMLogic Contract (Factory used to generate the VolumeRestrictionTM contract and this
    // manager attach with the securityToken contract at the time of deployment)
    return deployer.deploy(VolumeRestrictionTMLogic, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: PolymathAccount });
  }).then(() => {
    // B) Deploy the VestingEscrowWalletFactory Contract (Factory used to generate the VestingEscrowWallet contract and this
    // manager attach with the securityToken contract at the time of deployment)
    return deployer.deploy(VestingEscrowWalletFactory, PolyToken, 0, 0, 0, VestingEscrowWalletLogic.address, { from: PolymathAccount });
  }).then(() => {
    // B) Deploy the GeneralTransferManagerFactory Contract (Factory used to generate the GeneralTransferManager contract and this
    // manager attach with the securityToken contract at the time of deployment)
    return deployer.deploy(GeneralTransferManagerFactory, PolyToken, 0, 0, 0, GeneralTransferManagerLogic.address, { from: PolymathAccount });
  }).then(() => {
    // C) Deploy the GeneralPermissionManagerFactory Contract (Factory used to generate the GeneralPermissionManager contract and
    // this manager attach with the securityToken contract at the time of deployment)
    return deployer.deploy(GeneralPermissionManagerFactory, PolyToken, 0, 0, 0, { from: PolymathAccount });
  }).then(() => {
    // D) Deploy the CountTransferManagerFactory Contract (Factory used to generate the CountTransferManager contract use
    // to track the counts of the investors of the security token)
    return deployer.deploy(CountTransferManagerFactory, PolyToken, 0, 0, 0, { from: PolymathAccount });
  }).then(() => {
    // D) Deploy the PercentageTransferManagerFactory Contract (Factory used to generate the PercentageTransferManager contract use
    // to track the percentage of investment the investors could do for a particular security token)
    return deployer.deploy(PercentageTransferManagerFactory, PolyToken, 0, 0, 0, { from: PolymathAccount });
  }).then(() => {
    // D) Deploy the EtherDividendCheckpointFactory Contract (Factory used to generate the EtherDividendCheckpoint contract use
    // to provide the functionality of the dividend in terms of ETH)
    return deployer.deploy(EtherDividendCheckpointFactory, PolyToken, 0, 0, 0, EtherDividendCheckpointLogic.address, { from: PolymathAccount });
  }).then(() => {
    // D) Deploy the ERC20DividendCheckpointFactory Contract (Factory used to generate the ERC20DividendCheckpoint contract use
    // to provide the functionality of the dividend in terms of ERC20 token)
    return deployer.deploy(ERC20DividendCheckpointFactory, PolyToken, 0, 0, 0, ERC20DividendCheckpointLogic.address, { from: PolymathAccount });
  }).then(() => {
    // D) Deploy the VolumeRestrictionTMFactory Contract (Factory used to generate the VolumeRestrictionTM contract use
    // to provide the functionality of restricting the token volume)
    return deployer.deploy(VolumeRestrictionTMFactory, PolyToken, 0, 0, 0, VolumeRestrictionTMLogic.address, { from: PolymathAccount });
  }).then(() => {
    // D) Deploy the ManualApprovalTransferManagerFactory Contract (Factory used to generate the ManualApprovalTransferManager contract use
    // to manual approve the transfer that will overcome the other transfer restrictions)
    return deployer.deploy(ManualApprovalTransferManagerFactory, PolyToken, 0, 0, 0, { from: PolymathAccount });
  }).then(() => {
    // H) Deploy the STVersionProxy001 Contract which contains the logic of deployment of securityToken.
    return deployer.deploy(STFactory, GeneralTransferManagerFactory.address, { from: PolymathAccount });
  }).then(() => {
    // K) Deploy the FeatureRegistry contract to control feature switches
    return deployer.deploy(FeatureRegistry, PolymathRegistry.address, { from: PolymathAccount });
  }).then(() => {
    // Assign the address into the FeatureRegistry key
    return polymathRegistry.changeAddress("FeatureRegistry", FeatureRegistry.address, { from: PolymathAccount });
  }).then(() => {
    // J) Deploy the SecurityTokenRegistry contract (Used to hold the deployed secuirtyToken details. It also act as the interface to deploy the SecurityToken)
    return deployer.deploy(SecurityTokenRegistry, { from: PolymathAccount })
  }).then(() => {
    return deployer.deploy(SecurityTokenRegistryProxy, { from: PolymathAccount });
  }).then(() => {
    let bytesProxy = web3.eth.abi.encodeFunctionCall(functionSignatureProxy, [PolymathRegistry.address, STFactory.address, initRegFee, initRegFee, PolyToken, PolymathAccount]);
    return SecurityTokenRegistryProxy.at(SecurityTokenRegistryProxy.address).upgradeToAndCall("1.0.0", SecurityTokenRegistry.address, bytesProxy, { from: PolymathAccount });
  }).then(() => {
    // Assign the address into the SecurityTokenRegistry key
    return polymathRegistry.changeAddress("SecurityTokenRegistry", SecurityTokenRegistryProxy.address, { from: PolymathAccount });
  }).then(() => {
    // Update all addresses into the registry contract by calling the function updateFromregistry
    return moduleRegistry.updateFromRegistry({ from: PolymathAccount });
  }).then(() => {
    // D) Register the PercentageTransferManagerFactory in the ModuleRegistry to make the factory available at the protocol level.
    // So any securityToken can use that factory to generate the PercentageTransferManager contract.
    return moduleRegistry.registerModule(PercentageTransferManagerFactory.address, { from: PolymathAccount });
  }).then(() => {
    // D) Register the VestingEscrowWalletFactory in the ModuleRegistry to make the factory available at the protocol level.
    // So any securityToken can use that factory to generate the VestingEscrowWallet contract.
    return moduleRegistry.registerModule(VestingEscrowWalletFactory.address, { from: PolymathAccount });
  }).then(() => {
    // D) Register the CountTransferManagerFactory in the ModuleRegistry to make the factory available at the protocol level.
    // So any securityToken can use that factory to generate the CountTransferManager contract.
    return moduleRegistry.registerModule(CountTransferManagerFactory.address, { from: PolymathAccount });
  }).then(() => {
    // D) Register the GeneralTransferManagerFactory in the ModuleRegistry to make the factory available at the protocol level.
    // So any securityToken can use that factory to generate the GeneralTransferManager contract.
    return moduleRegistry.registerModule(GeneralTransferManagerFactory.address, { from: PolymathAccount });
  }).then(() => {
    // E) Register the GeneralPermissionManagerFactory in the ModuleRegistry to make the factory available at the protocol level.
    // So any securityToken can use that factory to generate the GeneralPermissionManager contract.
    return moduleRegistry.registerModule(GeneralPermissionManagerFactory.address, { from: PolymathAccount });
  }).then(() => {
    // E) Register the GeneralPermissionManagerFactory in the ModuleRegistry to make the factory available at the protocol level.
    // So any securityToken can use that factory to generate the GeneralPermissionManager contract.
    return moduleRegistry.registerModule(EtherDividendCheckpointFactory.address, { from: PolymathAccount });
  }).then(() => {
    // D) Register the VolumeRestrictionTMFactory in the ModuleRegistry to make the factory available at the protocol level.
    // So any securityToken can use that factory to generate the VolumeRestrictionTM contract.
    return moduleRegistry.registerModule(VolumeRestrictionTMFactory.address, { from: PolymathAccount });
  }).then(() => {
    // D) Register the ManualApprovalTransferManagerFactory in the ModuleRegistry to make the factory available at the protocol level.
    // So any securityToken can use that factory to generate the ManualApprovalTransferManager contract.
    return moduleRegistry.registerModule(ManualApprovalTransferManagerFactory.address, { from: PolymathAccount });
  }).then(() => {
    // E) Register the ERC20DividendCheckpointFactory in the ModuleRegistry to make the factory available at the protocol level.
    // So any securityToken can use that factory to generate the ERC20DividendCheckpoint contract.
    return moduleRegistry.registerModule(ERC20DividendCheckpointFactory.address, { from: PolymathAccount });
  }).then(() => {
    // F) Once the GeneralTransferManagerFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
    // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
    // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(GeneralTransferManagerFactory.address, true, { from: PolymathAccount });
  }).then(() => {
    // G) Once the CountTransferManagerFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
    // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
    // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(CountTransferManagerFactory.address, true, { from: PolymathAccount });
  }).then(() => {
    // G) Once the PercentageTransferManagerFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
    // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
    // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(PercentageTransferManagerFactory.address, true, { from: PolymathAccount });
  }).then(() => {
    // G) Once the GeneralPermissionManagerFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
    // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
    // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(GeneralPermissionManagerFactory.address, true, { from: PolymathAccount })
  }).then(() => {
    // G) Once the EtherDividendCheckpointFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
    // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
    // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(EtherDividendCheckpointFactory.address, true, { from: PolymathAccount });
  }).then(() => {
    // G) Once the ERC20DividendCheckpointFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
    // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
    // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(ERC20DividendCheckpointFactory.address, true, { from: PolymathAccount });
  }).then(() => {
    // G) Once the VolumeRestrictionTMFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
    // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
    // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(VolumeRestrictionTMFactory.address, true, { from: PolymathAccount });
  }).then(() => {
    // G) Once the ManualApprovalTransferManagerFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
    // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
    // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(ManualApprovalTransferManagerFactory.address, true, { from: PolymathAccount });
  }).then(() => {
    // F) Once the VestingEscrowWalletFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
    // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
    // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(VestingEscrowWalletFactory.address, true, { from: PolymathAccount });
  }).then(() => {
    // M) Deploy the CappedSTOFactory (Use to generate the CappedSTO contract which will used to collect the funds ).
    return deployer.deploy(CappedSTOFactory, PolyToken, cappedSTOSetupCost, 0, 0, { from: PolymathAccount })
  }).then(() => {
    // N) Register the CappedSTOFactory in the ModuleRegistry to make the factory available at the protocol level.
    // So any securityToken can use that factory to generate the CappedSTOFactory contract.
    return moduleRegistry.registerModule(CappedSTOFactory.address, { from: PolymathAccount })
  }).then(() => {
    // G) Once the CappedSTOFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
    // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
    // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(CappedSTOFactory.address, true, { from: PolymathAccount })
  }).then(() => {
    // H) Deploy the USDTieredSTOFactory (Use to generate the USDTieredSTOFactory contract which will used to collect the funds ).
    return deployer.deploy(USDTieredSTOFactory, PolyToken, usdTieredSTOSetupCost, 0, 0, USDTieredSTOLogic.address, { from: PolymathAccount })
  }).then(() => {
    // I) Register the USDTieredSTOFactory in the ModuleRegistry to make the factory available at the protocol level.
    // So any securityToken can use that factory to generate the USDTieredSTOFactory contract.
    return moduleRegistry.registerModule(USDTieredSTOFactory.address, { from: PolymathAccount })
  }).then(() => {
    // J) Once the USDTieredSTOFactory registered with the ModuleRegistry contract then for making them accessble to the securityToken
    // contract, Factory should comes under the verified list of factories or those factories deployed by the securityToken issuers only.
    // Here it gets verified because it is deployed by the third party account (Polymath Account) not with the issuer accounts.
    return moduleRegistry.verifyModule(USDTieredSTOFactory.address, true, { from: PolymathAccount })
  }).then(() => {
    return polymathRegistry.changeAddress("PolyUsdOracle", POLYOracle, { from: PolymathAccount });
  }).then(() => {
    return polymathRegistry.changeAddress("EthUsdOracle", ETHOracle, { from: PolymathAccount });
  }).then(() => {
    return deployer.deploy(SecurityToken, 'a', 'a', 18, 1, 'a', polymathRegistry.address, { from: PolymathAccount });
  }).then(() => {
    console.log('\n');
    console.log(`
    ----------------------- Polymath Network Smart Contracts: -----------------------
    PolymathRegistry:                     ${PolymathRegistry.address}
    SecurityTokenRegistry (Proxy):        ${SecurityTokenRegistryProxy.address}
    ModuleRegistry (Proxy):               ${ModuleRegistryProxy.address}
    FeatureRegistry:                      ${FeatureRegistry.address}

    ETHOracle:                            ${ETHOracle}
    POLYOracle:                           ${POLYOracle}

    STFactory:                            ${STFactory.address}
    GeneralTransferManagerLogic:          ${GeneralTransferManagerLogic.address}
    GeneralTransferManagerFactory:        ${GeneralTransferManagerFactory.address}
    GeneralPermissionManagerFactory:      ${GeneralPermissionManagerFactory.address}

    CappedSTOFactory:                     ${CappedSTOFactory.address}
    USDTieredSTOFactory:                  ${USDTieredSTOFactory.address}
    USDTieredSTOLogic:                    ${USDTieredSTOLogic.address}

    CountTransferManagerFactory:          ${CountTransferManagerFactory.address}
    PercentageTransferManagerFactory:     ${PercentageTransferManagerFactory.address}
    ManualApprovalTransferManagerFactory: ${ManualApprovalTransferManagerFactory.address}
    EtherDividendCheckpointLogic:         ${EtherDividendCheckpointLogic.address}
    ERC20DividendCheckpointLogic:         ${ERC20DividendCheckpointLogic.address}
    EtherDividendCheckpointFactory:       ${EtherDividendCheckpointFactory.address}
    ERC20DividendCheckpointFactory:       ${ERC20DividendCheckpointFactory.address}
    VolumeRestrictionTMFactory:           ${VolumeRestrictionTMFactory.address}
    VolumeRestrictionTMLogic:             ${VolumeRestrictionTMLogic.address}
    VestingEscrowWalletFactory:           ${VestingEscrowWalletFactory.address}
    VestingEscrowWalletLogic:             ${VestingEscrowWalletLogic.address}
    ---------------------------------------------------------------------------------
    `);
    console.log('\n');
    // -------- END OF POLYMATH NETWORK Configuration -------//
  });
}
