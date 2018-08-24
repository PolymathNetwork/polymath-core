const abis = require('../helpers/contract_abis');
// Generate web3 instance
const Web3 = require('web3');
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

let _polymathRegistry;
let _moduleRegistry;

function getPolymathRegistryAddress(networkId) {
  let result;
  switch (networkId) {
    case 1: // MAINNET
      result = "0x06595656b93ce14834f0d22b7bbda4382d5ab510";
      break;
    case 3: // ROPSTEN
      result = "";
      break;
    case 15: // GANACHE
      result = JSON.parse(require('fs').readFileSync('./build/contracts/PolymathRegistry.json').toString()).networks[networkId].address;
      break;
    case 42: // KOVAN
      result = "0x0879dece79f0b7749e2698d377049f5490a06c71";
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
    let moduleRegistryAbi = abis.moduleRegistryAbi();
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
  tickerRegistry: async function() {
    let polymathRegistry = await getPolymathRegistry();
    return await polymathRegistry.methods.getAddress("TickerRegistry").call();
  },
  securityTokenRegistry: async function() {
    let polymathRegistry = await getPolymathRegistry();
    return await polymathRegistry.methods.getAddress("SecurityTokenRegistry").call();
  },
  moduleRegistry: async function() {
    let polymathRegistry = await getPolymathRegistry();
    return await polymathRegistry.methods.getAddress("ModuleRegistry").call();
  },
  polyToken: async function() {
    let polymathRegistry = await getPolymathRegistry();
    return await polymathRegistry.methods.getAddress("PolyToken").call();
  },
  cappedSTOFactoryAddress: async function() {
    let networkId = await web3.eth.net.getId();
    if (networkId == 1)
      return "0x2aa1b133f464ac08f66c2f702581d014e4603d31";
    else if (networkId == 42)
      return "0x5ad2162dea12e9074641cb3d729102e13d095aa1"; // Updated to poly_oracle deployment
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTOFactory.json').toString()).networks[networkId].address;
  },
  usdTieredSTOFactoryAddress: async function() {
    let networkId = await web3.eth.net.getId();
    if (networkId == 1)
      throw new Error("Not implemented");
    else if (networkId == 42)
      return "0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3"; // Updated to poly_oracle deployment
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/USDTieredSTOFactory.json').toString()).networks[networkId].address;
  },
  etherDividendCheckpointFactoryAddress: async function() {
    let networkId = await web3.eth.net.getId();
    if (networkId == 1)
      return "0x0da7ed8789348ac40937cf6ae8ff521eee43816c";
    else if (networkId == 42)
      return "0x8e34a955dcdd6c0e4a88fb21af562b7db0b20100";
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/EtherDividendCheckpointFactory.json').toString()).networks[networkId].address;
  },
  erc20DividendCheckpointFactoryAddress: async function() {
    let networkId = await web3.eth.net.getId();
    if (networkId == 1)
      return "0x6950096964b7adae34d5a3d1792fe73afbe9ddbc";
    else if (networkId == 42)
      return "0x9d8778fc5b4d7b97a74dcfee6661d14709cf5180";
    else 
      return JSON.parse(require('fs').readFileSync('./build/contracts/ERC20DividendCheckpointFactory.json').toString()).networks[networkId].address;
  }
};