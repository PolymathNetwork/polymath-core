import { encodeProxyCall, encodeModuleCall } from './encodeCall';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const ModuleRegistryProxy = artifacts.require('./ModuleRegistryProxy.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistryProxy = artifacts.require('./SecurityTokenRegistryProxy.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const SecurityTokenRegistryMock = artifacts.require('./SecurityTokenRegistryMock.sol');
const FeatureRegistry = artifacts.require('./FeatureRegistry.sol');
const STFactory = artifacts.require('./STFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const PolyToken = artifacts.require('./PolyToken.sol');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545')); // Hardcoded development port

// Contract Instance Declaration
let I_GeneralTransferManagerFactory;
let I_GeneralTransferManager;
let I_ModuleRegistryProxy;
let I_ModuleRegistry;
let I_FeatureRegistry;
let I_SecurityTokenRegistry;
let I_SecurityToken;
let I_PolyToken;
let I_STFactory;
let I_PolymathRegistry;
let I_SecurityTokenRegistryProxy;
let I_STRProxied;
let I_MRProxied;

// Initial fee for ticker registry and security token registry
const initRegFee = web3.utils.toWei('250');

const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
const MRProxyParameters = ['address', 'address'];

export async function setUpPolymathNetwork(account_polymath, token_owner) {
  // ----------- POLYMATH NETWORK Configuration ------------
  // Step 1: Deploy the PolyToken and PolymathRegistry
  let a = await deployPolyRegistryAndPolyToken(account_polymath, token_owner);
  // Step 2: Deploy the FeatureRegistry
  let b = await deployFeatureRegistry(account_polymath);
  // STEP 3: Deploy the ModuleRegistry
  let c = await deployModuleRegistry(account_polymath);
  // STEP 4: Deploy the GeneralTransferManagerFactory
  let d = await deployGTM(account_polymath);
  // Step 6: Deploy the STversionProxy contract
  let e = await deploySTFactory(account_polymath);
  // Step 7: Deploy the SecurityTokenRegistry
  let f = await deploySTR(account_polymath);
  // Step 8: update the registries addresses from the PolymathRegistry contract
  await setInPolymathRegistry(account_polymath);
  // STEP 9: Register the Modules with the ModuleRegistry contract
  await registerGTM(account_polymath);
  let tempArray = new Array(a, b, c, d, e, f);
  return mergeReturn(tempArray);
}

function mergeReturn(returnData) {
  let returnArray = new Array();
  for (let i = 0; i < returnData.length; i++) {
    for (let j = 0; j < returnData[i].length; j++) {
      returnArray.push(returnData[i][j]);
    }
  }
  return returnArray;
}

async function deployPolyRegistryAndPolyToken(account_polymath, token_owner) {
  // Step 0: Deploy the PolymathRegistry
  I_PolymathRegistry = await PolymathRegistry.new({ from: account_polymath });

  // Step 1: Deploy the token Faucet and Mint tokens for token_owner
  I_PolyToken = await PolyTokenFaucet.new();
  await I_PolyToken.getTokens(10000 * Math.pow(10, 18), token_owner);

  return new Array(I_PolymathRegistry, I_PolyToken);
}

async function deployFeatureRegistry(account_polymath) {
  I_FeatureRegistry = await FeatureRegistry.new(I_PolymathRegistry.address, {
    from: account_polymath
  });

  return new Array(I_FeatureRegistry);
}

async function deployModuleRegistry(account_polymath) {
  I_ModuleRegistry = await ModuleRegistry.new({ from: account_polymath });
  // Step 3 (b):  Deploy the proxy and attach the implementation contract to it
  I_ModuleRegistryProxy = await ModuleRegistryProxy.new({ from: account_polymath });
  let bytesMRProxy = encodeProxyCall(MRProxyParameters, [I_PolymathRegistry.address, account_polymath]);
  await I_ModuleRegistryProxy.upgradeToAndCall('1.0.0', I_ModuleRegistry.address, bytesMRProxy, { from: account_polymath });
  I_MRProxied = await ModuleRegistry.at(I_ModuleRegistryProxy.address);

  return new Array(I_ModuleRegistry, I_ModuleRegistryProxy, I_MRProxied);
}

async function deployGTM(account_polymath) {
  I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, { from: account_polymath });

  assert.notEqual(
    I_GeneralTransferManagerFactory.address.valueOf(),
    '0x0000000000000000000000000000000000000000',
    'GeneralTransferManagerFactory contract was not deployed'
  );

  return new Array(I_GeneralTransferManagerFactory);
}

async function deploySTFactory(account_polymath) {
  I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, { from: account_polymath });

  assert.notEqual(I_STFactory.address.valueOf(), '0x0000000000000000000000000000000000000000', 'STFactory contract was not deployed');

  return new Array(I_STFactory);
}

async function deploySTR(account_polymath) {
  I_SecurityTokenRegistry = await SecurityTokenRegistry.new({ from: account_polymath });

  assert.notEqual(
    I_SecurityTokenRegistry.address.valueOf(),
    '0x0000000000000000000000000000000000000000',
    'SecurityTokenRegistry contract was not deployed'
  );

  // Step 9 (a): Deploy the proxy
  I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({ from: account_polymath });
  let bytesProxy = encodeProxyCall(STRProxyParameters, [
    I_PolymathRegistry.address,
    I_STFactory.address,
    initRegFee,
    initRegFee,
    I_PolyToken.address,
    account_polymath
  ]);
  await I_SecurityTokenRegistryProxy.upgradeToAndCall('1.0.0', I_SecurityTokenRegistry.address, bytesProxy, { from: account_polymath });
  I_STRProxied = SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);

  return new Array(I_SecurityTokenRegistry, I_SecurityTokenRegistryProxy, I_STRProxied);
}

async function setInPolymathRegistry(account_polymath) {
  await I_PolymathRegistry.changeAddress('PolyToken', I_PolyToken.address, { from: account_polymath });
  await I_PolymathRegistry.changeAddress('ModuleRegistry', I_ModuleRegistryProxy.address, { from: account_polymath });
  await I_PolymathRegistry.changeAddress('FeatureRegistry', I_FeatureRegistry.address, { from: account_polymath });
  await I_PolymathRegistry.changeAddress('SecurityTokenRegistry', I_SecurityTokenRegistryProxy.address, { from: account_polymath });
  await I_MRProxied.updateFromRegistry({ from: account_polymath });
}

async function registerGTM(account_polymath) {
  await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
  await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });
}
