const abis = require('../helpers/contract_abis');

let _polymathRegistry;
let _moduleRegistry;

function getPolymathRegistryAddress(networkId) {
  let result;
  switch (networkId) {
    case 1: // MAINNET
      result = "0xdfabf3e4793cd30affb47ab6fa4cf4eef26bbc27";
      break;
    case 3: // ROPSTEN
      result = "";
      break;
    case 5: // GOERLI
      result = "0x7e3c8aF98538Ba19A10Dfc7E8F5469a76998b0f0";
      break;
    case 15: // GANACHE
      result = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/PolymathRegistry.json`).toString()).networks[networkId].address;
      break;
    case 42: // KOVAN
      result = "0x5b215a7d39ee305ad28da29bf2f0425c6c2a00b3";
      break;
  }

  return result;
}

async function getPolymathRegistry() {
  if (typeof _polymathRegistry === 'undefined') {
    let networkId = await web3.eth.net.getId();
    let polymathRegistryAddress = getPolymathRegistryAddress(networkId);
    let polymathRegistryAbi = abis.polymathRegistry();
    _polymathRegistry = new web3.eth.Contract(polymathRegistryAbi, polymathRegistryAddress);
    _polymathRegistry.setProvider(web3.currentProvider);
  }

  return _polymathRegistry;
}

async function getModuleRegistry() {
  if (typeof _moduleRegistry === 'undefined') {
    let polymathRegistry = await getPolymathRegistry();
    let moduleRegistryAddress = await polymathRegistry.methods.getAddress("ModuleRegistry").call();
    let moduleRegistryAbi = abis.moduleRegistry();
    _moduleRegistry = new web3.eth.Contract(moduleRegistryAbi, moduleRegistryAddress);
    _moduleRegistry.setProvider(web3.currentProvider);
  }

  return _moduleRegistry;
}

module.exports = {
  polymathRegistry: async function () {
    let networkId = await web3.eth.net.getId();
    return getPolymathRegistryAddress(networkId);
  },
  securityTokenRegistry: async function () {
    let polymathRegistry = await getPolymathRegistry();
    return await polymathRegistry.methods.getAddress("SecurityTokenRegistry").call();
  },
  moduleRegistry: async function () {
    let polymathRegistry = await getPolymathRegistry();
    return await polymathRegistry.methods.getAddress("ModuleRegistry").call();
  },
  featureRegistry: async function () {
    let polymathRegistry = await getPolymathRegistry();
    return await polymathRegistry.methods.getAddress("FeatureRegistry").call();
  },
  polyToken: async function () {
    let polymathRegistry = await getPolymathRegistry();
    return await polymathRegistry.methods.getAddress("PolyToken").call();
  },
  usdToken: async function () {
    let networkId = await web3.eth.net.getId();
    if (networkId == 1)
      return "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359";
    else if (networkId == 42)
      return "0xc4375b7de8af5a38a93548eb8453a498222c4ff2";
    else
      return JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/PolyTokenFaucet.json`).toString()).networks[networkId].address;
  },
  getModuleFactoryAddressByName: async function (stAddress, moduleType, moduleName) {
    let moduleRegistry = await getModuleRegistry();
    let availableModules = await moduleRegistry.methods.getModulesByTypeAndToken(moduleType, stAddress).call();

    let result = null;
    let counter = 0;
    let moduleFactoryABI = abis.moduleFactory();
    while (result == null && counter < availableModules.length) {
      let moduleFactory = new web3.eth.Contract(moduleFactoryABI, availableModules[counter]);
      let currentName = web3.utils.toAscii(await moduleFactory.methods.name().call());
      if (currentName.localeCompare(moduleName) == 0) {
        result = moduleFactory.options.address;
      }
      counter++;
    }

    if (result == null) {
      throw new Error(`Module factory named ${moduleName} was not found.`);
    }

    return result;
  }
};
