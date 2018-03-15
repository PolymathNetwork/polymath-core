const SecurityToken = artifacts.require('./SecurityToken.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager.sol');
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO= artifacts.require('./DummySTO.sol');
const SecurityTokenRegistrar = artifacts.require('./SecurityTokenRegistrar.sol');
const TickerRegistrar = artifacts.require('./TickerRegistrar.sol');

const owner = web3.eth.accounts[1];
const admin = web3.eth.accounts[2];
const investor1 = web3.eth.accounts[3];
const zero = "0x0000000000000000000000000000000000000000";
const totalSupply = 100000;
const name = "TEST POLY";
const symbol = "TPOLY";
const securityDetails = "This is a legit issuance...";
const perm = [];

module.exports = async (deployer, network) => {

  // A) POLYMATH NETWORK Configuration :: DO THIS ONLY ONCE
  // 1. Deploy Registry, Transfer Manager
  await deployer.deploy(ModuleRegistry);
  await deployer.deploy(GeneralTransferManagerFactory);

  // 2. Register the Transfer Manager module
  let moduleRegistry = await ModuleRegistry.deployed();
  await moduleRegistry.registerModule(GeneralTransferManagerFactory.address);

  // 3. Deploy Ticker Registrar and SecurityTokenRegistrar
  await deployer.deploy(TickerRegistrar, {from: admin});
  await deployer.deploy(SecurityTokenRegistrar, ModuleRegistry.address, TickerRegistrar.address, GeneralTransferManagerFactory.address);
  let tickerRegistrar = await TickerRegistrar.deployed();
  await tickerRegistrar.setTokenRegistrar(SecurityTokenRegistrar.address, {from: admin });

  // B) DEPLOY STO factories and register them with the Registry
  await deployer.deploy(DummySTOFactory);
  await moduleRegistry.registerModule(DummySTOFactory.address);

  // -------- END OF SETUP -------

  // ** Token Deployment **

  // 1. Register ticker symbol
  await tickerRegistrar.registerTicker(symbol, "poly@polymath.network", { from: owner });

  // 2. Deploy Token
  let STRegistrar = await SecurityTokenRegistrar.deployed();
  let r_generateSecurityToken = await STRegistrar.generateSecurityToken(owner, name, symbol, 18, securityDetails);
  let newSecurityTokenAddress = r_generateSecurityToken.logs[0].args._securityTokenAddress;
  let securityToken = await SecurityToken.at(newSecurityTokenAddress);
  //console.log(securityToken);

  // 3. Add Transfer and STO modules (Should be removed in next iteration)
  let r_GeneralTransferManagerFactory = await securityToken.addModule(GeneralTransferManagerFactory.address, zero, 0, perm, true, {from: owner});
  let generalTransferManagerAddress =  r_GeneralTransferManagerFactory.logs[1].args._module;
  let generalTransferManager = await GeneralTransferManager.at(generalTransferManagerAddress);

  let r_DummySTOFactory = await securityToken.addModule(DummySTOFactory.address, zero, 0, perm, false, {from: owner});
  let dummySTOAddress =  r_DummySTOFactory.logs[1].args._module;
  let dummySTO = await DummySTO.at(dummySTOAddress);

  // 4. Add investor to whitelist
  await generalTransferManager.modifyWhitelist(investor1, Date.now()/1000, {from:owner});

  // 5. INVEST
  let r = await dummySTO.generateTokens(investor1, 1000, {from: owner});
  let investorCount = await dummySTO.investorCount();

  console.log(`
    ---------------------------------------------------------------
    --------- INVESTED IN STO ---------
    ---------------------------------------------------------------
    - ${r.logs[0].args._investor} purchased ${r.logs[0].args._amount} tokens!
    - Investor count: ${investorCount}
    ---------------------------------------------------------------
  `);

};
