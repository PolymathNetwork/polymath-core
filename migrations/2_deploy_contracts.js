const SecurityToken = artifacts.require('./SecurityToken.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager.sol');
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO= artifacts.require('./DummySTO.sol');
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO= artifacts.require('./CappedSTO.sol');
const SecurityTokenRegistrar = artifacts.require('./SecurityTokenRegistrar.sol');
const TickerRegistrar = artifacts.require('./TickerRegistrar.sol');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

var BigNumber = require('bignumber.js')

const zero = "0x0000000000000000000000000000000000000000";
const totalSupply = 100000;
const name = "TEST POLY";
const symbol = "TPOLY";
const tokenDetails = "This is a legit issuance...";
const perm = [];

module.exports = async (deployer, network, accounts) => {

  const owner = accounts[1];
  const admin = accounts[2];
  const investor1 = accounts[3];

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
  await deployer.deploy(CappedSTOFactory);
  await moduleRegistry.registerModule(CappedSTOFactory.address);

  // -------- END OF SETUP -------

  // ** Token Deployment **

  // 1. Register ticker symbol
  await tickerRegistrar.registerTicker(symbol, "poly@polymath.network", { from: owner });

  // 2. Deploy Token
  let STRegistrar = await SecurityTokenRegistrar.deployed();
  let r_generateSecurityToken = await STRegistrar.generateSecurityToken(name, symbol, 18, tokenDetails, { from : owner });
  let newSecurityTokenAddress = r_generateSecurityToken.logs[0].args._securityTokenAddress;
  let securityToken = await SecurityToken.at(newSecurityTokenAddress);
  //console.log(securityToken);

  // 3. Get Transfer Module and Initialize STO module
  let generalTransferManagerObject = await securityToken.modules(1);
  let generalTransferManager = await GeneralTransferManager.at(generalTransferManagerObject[1]);

  //Generate bytes to initialise the DummySTO - args for its initFunction are:
  //configure(uint256 _startTime, uint256 _endTime, uint256 _cap, bytes32 _someBytes)
  // let bytesSTO = web3.eth.abi.encodeFunctionCall({
  //     name: 'configure',
  //     type: 'function',
  //     inputs: [{
  //         type: 'uint256',
  //         name: '_startTime'
  //     },{
  //         type: 'uint256',
  //         name: '_endTime'
  //     },{
  //         type: 'uint256',
  //         name: '_cap'
  //     },{
  //         type: 'string',
  //         name: '_someString'
  //     }
  //     ]
  // }, ['1', '2', '3', "SomeString"]);
  //address _moduleFactory, bytes _data, uint256 _maxCost, uint256[] _perm, bool _replaceable
  // let r_DummySTOFactory = await securityToken.addModule(DummySTOFactory.address, bytesSTO, 0, perm, false, {from: owner});
  // let dummySTOAddress =  r_DummySTOFactory.logs[1].args._module;
  // let dummySTO = await DummySTO.at(dummySTOAddress);
  //
  // console.log((await dummySTO.startTime()).toString());
  // console.log((await dummySTO.endTime()).toString());
  // console.log((await dummySTO.cap()).toString());
  // console.log(await dummySTO.someString());

  let bytesSTO = web3.eth.abi.encodeFunctionCall({
      name: 'configure',
      type: 'function',
      inputs: [{
          type: 'uint256',
          name: '_startTime'
      },{
          type: 'uint256',
          name: '_endTime'
      },{
          type: 'uint256',
          name: '_cap'
      },{
          type: 'uint256',
          name: '_rate'
      }
      ]
  }, [(Date.now())/1000, (Date.now()+3600 * 24)/1000, web3.utils.toWei('100000', 'ether'), '1000']);

  let r_CappedSTOFactory = await securityToken.addModule(CappedSTOFactory.address, bytesSTO, 0, perm, false, {from: owner});
  let cappedSTOAddress =  r_CappedSTOFactory.logs[1].args._module;
  let cappedSTO = await CappedSTO.at(cappedSTOAddress);

  // console.log((await cappedSTO.startTime()).toString());
  // console.log((await cappedSTO.endTime()).toString());
  // console.log((await cappedSTO.cap()).toString());
  // console.log((await cappedSTO.rate()).toString());

  // 4. Add investor to whitelist
  await generalTransferManager.modifyWhitelist(investor1, (Date.now()+3600 * 24)/1000, (Date.now()+3600 * 24)/1000, {from:owner});

  // 5. INVEST
  let r = await cappedSTO.buyTokens(investor1, {from: owner, value:web3.utils.toWei('1', 'ether')});
  let investorCount = await cappedSTO.investorCount();

  console.log(`
    ---------------------------------------------------------------
    --------- INVESTED IN STO ---------
    ---------------------------------------------------------------
    - ${r.logs[0].args.beneficiary} purchased ${web3.utils.fromWei(r.logs[0].args.amount.toString(10))} tokens!
    - Investor count: ${investorCount}
    ---------------------------------------------------------------
  `);

};
